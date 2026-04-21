package service

import (
	"context"
	"fmt"
	"io"
	"logistics-platform-gin/config"
	"logistics-platform-gin/internal/model"
	"path/filepath"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"log"
)

type MinIOService struct {
	client   *minio.Client
	bucket   string
	endpoint string
}

func NewMinIOService() (*MinIOService, error) {
	cfg := config.Load()

	client, err := minio.New(cfg.MinIOEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIOAccessKey, cfg.MinIOSecretKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, fmt.Errorf("MinIO 客户端创建失败: %w", err)
	}

	svc := &MinIOService{client: client, bucket: cfg.MinIOBucket, endpoint: cfg.MinIOEndpoint}

	// Ensure bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.MinIOBucket)
	if err != nil {
		return nil, fmt.Errorf("检查 Bucket 失败: %w", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, cfg.MinIOBucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("创建 Bucket 失败: %w", err)
		}
		log.Printf("MinIO Bucket '%s' 创建成功", cfg.MinIOBucket)
	}

	return svc, nil
}

// UploadAvatar 上传用户头像
// key: "avatar/{userId}.{ext}"
func (s *MinIOService) UploadAvatar(userID int64, filename string, reader io.Reader, size int64) (string, error) {
	ext := filepath.Ext(filename)
	key := fmt.Sprintf("avatar/%d%s", userID, ext)
	return s.putObject(key, reader, size, "image")
}

// UploadFile 上传通用文件
// category: "order-attachment" / "warehouse-doc" / etc.
func (s *MinIOService) UploadFile(category string, filename string, reader io.Reader, size int64) (string, error) {
	timestamp := time.Now().Format("20060102150405")
	key := fmt.Sprintf("%s/%s_%s", category, timestamp, filename)
	return s.putObject(key, reader, size, "application/octet-stream")
}

func (s *MinIOService) putObject(key string, reader io.Reader, size int64, contentType string) (string, error) {
	ctx := context.Background()
	_, err := s.client.PutObject(ctx, s.bucket, key, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("上传文件失败: %w", err)
	}

	// Return the object URL
	url := fmt.Sprintf("http://%s/%s/%s", s.endpoint, s.bucket, key)
	return url, nil
}

// GetPresignedURL 生成预签名 URL（7天有效期）
func (s *MinIOService) GetPresignedURL(key string) (string, error) {
	ctx := context.Background()
	presigned, err := s.client.PresignedGetObject(ctx, s.bucket, key, 7*24*time.Hour, nil)
	if err != nil {
		return "", fmt.Errorf("生成预签名 URL 失败: %w", err)
	}
	return presigned.String(), nil
}

// DeleteObject 删除对象
func (s *MinIOService) DeleteObject(key string) error {
	ctx := context.Background()
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

// ListObjects 列出对象（分页）
func (s *MinIOService) ListObjects(prefix string, maxKeys int) ([]minio.ObjectInfo, error) {
	ctx := context.Background()
	objects := s.client.ListObjects(ctx, s.bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		MaxKeys:   maxKeys,
		Recursive: true,
	})

	var result []minio.ObjectInfo
	for obj := range objects {
		if obj.Err != nil {
			return nil, obj.Err
		}
		result = append(result, obj)
	}
	return result, nil
}

// UploadOrderAttachment 上传订单附件（自动生成 key）
func (s *MinIOService) UploadOrderAttachment(orderNo string, filename string, reader io.Reader, size int64) (string, error) {
	key := fmt.Sprintf("order-attachment/%s_%s", orderNo, filename)
	return s.putObject(key, reader, size, "application/octet-stream")
}

// UpdateUserAvatar 更新用户头像（删除旧头像，上传新头像）
func (s *MinIOService) UpdateUserAvatar(user *model.SysUser, filename string, reader io.Reader, size int64) (string, error) {
	// Delete old avatar if exists
	if user.Avatar != "" {
		// Extract key from URL (last two path segments: bucket/key)
		// URL format: http://endpoint/bucket/key
		key := extractKeyFromURL(user.Avatar)
		if key != "" {
			s.DeleteObject(key)
		}
	}
	return s.UploadAvatar(user.ID, filename, reader, size)
}

func extractKeyFromURL(url string) string {
	// Simple extraction: take the last two slash-separated parts after the host
	// e.g. http://localhost:9000/logistics/avatar/1.png -> avatar/1.png
	for i := len(url) - 1; i >= 0; i-- {
		if url[i] == '/' && i > 0 {
			j := i - 1
			for j >= 0 && url[j] != '/' {
				j--
			}
			if j >= 0 {
				return url[j+1 : i+len(url)-(len(url)-i)]
			}
		}
	}
	return ""
}