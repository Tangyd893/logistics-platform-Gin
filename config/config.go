package config

import (
	"os"
	"strconv"
)

type Config struct {
	// 数据库
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// JWT
	JWTSecret string
	JWTExp    int64

	// RocketMQ
	RocketMQEnabled     bool
	RocketMQNamesrvAddr string
	RocketMQProxyURL    string
	RocketMQLoglevel    string

	// MinIO
	MinIOEnabled  bool
	MinIOEndpoint string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "logistics_user"),
		DBPassword: getEnv("DB_PASSWORD", "logistics_pass"),
		DBName:     getEnv("DB_NAME", "logistics"),
		JWTSecret:  getEnv("JWT_SECRET", "logistics-platform-secret-key-256bit"),
		JWTExp:     86400000, // 24 hours in ms

		// RocketMQ 配置
		RocketMQEnabled:    getEnvBool("ROCKETMQ_ENABLED", false),
		RocketMQNamesrvAddr: getEnv("ROCKETMQ_NAMESRV_ADDR", "localhost:9876"),
		RocketMQProxyURL:    getEnv("ROCKETMQ_PROXY_URL", ""),
		RocketMQLoglevel:   getEnv("ROCKETMQ_LOG_LEVEL", "warn"),

		// MinIO 配置
		MinIOEnabled:  getEnvBool("MINIO_ENABLED", false),
		MinIOEndpoint: getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinIOSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinIOBucket:   getEnv("MINIO_BUCKET", "logistics"),
	}
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost + " port=" + c.DBPort + " user=" + c.DBUser + " password=" + c.DBPassword + " dbname=" + c.DBName + " sslmode=disable"
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func getEnvBool(key string, defaultVal bool) bool {
	if val := os.Getenv(key); val != "" {
		if parsed, err := strconv.ParseBool(val); err == nil {
			return parsed
		}
	}
	return defaultVal
}