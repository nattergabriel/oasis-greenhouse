# ─── S3 + CloudFront for Frontend (Static Export) ───────────────────────────

# S3 bucket for frontend static files
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project}-frontend-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name    = "${var.project}-frontend"
    Project = var.project
  }
}

# Block public access (CloudFront will access via OAI)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for ${var.project} frontend"
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.frontend,
    aws_cloudfront_origin_access_identity.frontend
  ]
}

# CloudFront Function to rewrite directory URLs to index.html
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${var.project}-url-rewrite"
  runtime = "cloudfront-js-2.0"
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      // Append index.html to directory requests
      if (uri.endsWith('/')) {
        request.uri += 'index.html';
      }
      // Add /index.html if no file extension (handles SPA routes)
      else if (!uri.match(/\.[a-z0-9]+$/i)) {
        request.uri += '/index.html';
      }

      return request;
    }
  EOT
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe (cheapest)

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600    # 1 hour
    max_ttl                = 86400   # 24 hours
    compress               = true

    # Apply URL rewrite function
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }

  # Custom error page for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name    = "${var.project}-frontend-cdn"
    Project = var.project
  }
}
