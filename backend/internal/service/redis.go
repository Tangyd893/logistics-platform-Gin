package service

import (
	"context"
	"encoding/json"
	"fmt"
	"logistics-platform-gin/config"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// ===================== Redis Cache Service =====================

type CacheService struct {
	client *redis.Client
	enabled bool
}

func NewCacheService() (*CacheService, error) {
	cfg := config.Load()

	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
		PoolSize: 10,
	})

	svc := &CacheService{
		client:  client,
		enabled: cfg.RedisEnabled,
	}

	if !svc.enabled {
		log.Println("[Redis] 未启用（REDIS_ENABLED=false），缓存功能跳过")
		return svc, nil
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[Redis] 连接失败: %v（将跳过缓存功能）", err)
		svc.enabled = false
		return svc, nil
	}

	log.Printf("[Redis] 连接成功，地址: %s:%s", cfg.RedisHost, cfg.RedisPort)
	return svc, nil
}

// ===================== 通用缓存操作 =====================

// Set 将 value 序列化后存入 Redis，支持过期时间
func (s *CacheService) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if !s.enabled {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("序列化失败: %w", err)
	}
	return s.client.Set(ctx, key, data, ttl).Err()
}

// Get 从 Redis 取出并反序列化到 out（out 需为指针）
func (s *CacheService) Get(ctx context.Context, key string, out interface{}) error {
	if !s.enabled {
		return fmt.Errorf("cache disabled")
	}
	val, err := s.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(val, out)
}

// Delete 删除 key
func (s *CacheService) Delete(ctx context.Context, keys ...string) error {
	if !s.enabled {
		return nil
	}
	return s.client.Del(ctx, keys...).Err()
}

// Exists 检查 key 是否存在
func (s *CacheService) Exists(ctx context.Context, key string) bool {
	if !s.enabled {
		return false
	}
	ok, _ := s.client.Exists(ctx, key).Result()
	return ok > 0
}

// ===================== 业务缓存封装 =====================

// CacheOrderList 缓存订单列表（5分钟）
func (s *CacheService) CacheOrderList(ctx context.Context, userID int64, page int, pageSize int, orders interface{}) error {
	key := fmt.Sprintf("orders:user:%d:page:%d:size:%d", userID, page, pageSize)
	return s.Set(ctx, key, orders, 5*time.Minute)
}

// GetCachedOrderList 获取缓存的订单列表
func (s *CacheService) GetCachedOrderList(ctx context.Context, userID int64, page int, pageSize int, out interface{}) error {
	key := fmt.Sprintf("orders:user:%d:page:%d:size:%d", userID, page, pageSize)
	return s.Get(ctx, key, out)
}

// InvalidateOrderCache 失效用户所有订单缓存
func (s *CacheService) InvalidateOrderCache(ctx context.Context, userID int64) error {
	if !s.enabled {
		return nil
	}
	pattern := fmt.Sprintf("orders:user:%d:*", userID)
	return s.deleteByPattern(ctx, pattern)
}

// CacheWarehouseList 缓存仓库列表（10分钟）
func (s *CacheService) CacheWarehouseList(ctx context.Context, warehouses interface{}) error {
	return s.Set(ctx, "warehouses:all", warehouses, 10*time.Minute)
}

// GetCachedWarehouseList 获取缓存的仓库列表
func (s *CacheService) GetCachedWarehouseList(ctx context.Context, out interface{}) error {
	return s.Get(ctx, "warehouses:all", out)
}

// InvalidateWarehouseCache 失效仓库缓存
func (s *CacheService) InvalidateWarehouseCache(ctx context.Context) error {
	return s.Delete(ctx, "warehouses:all")
}

// CacheDriverList 缓存司机列表（10分钟）
func (s *CacheService) CacheDriverList(ctx context.Context, drivers interface{}) error {
	return s.Set(ctx, "drivers:all", drivers, 10*time.Minute)
}

// GetCachedDriverList 获取缓存的司机列表
func (s *CacheService) GetCachedDriverList(ctx context.Context, out interface{}) error {
	return s.Get(ctx, "drivers:all", out)
}

// InvalidateDriverCache 失效司机缓存
func (s *CacheService) InvalidateDriverCache(ctx context.Context) error {
	return s.Delete(ctx, "drivers:all")
}

// CacheUserInfo 缓存用户信息（15分钟）
func (s *CacheService) CacheUserInfo(ctx context.Context, userID int64, user interface{}) error {
	key := fmt.Sprintf("user:%d", userID)
	return s.Set(ctx, key, user, 15*time.Minute)
}

// GetCachedUserInfo 获取缓存的用户信息
func (s *CacheService) GetCachedUserInfo(ctx context.Context, userID int64, out interface{}) error {
	key := fmt.Sprintf("user:%d", userID)
	return s.Get(ctx, key, out)
}

// InvalidateUserCache 失效用户缓存
func (s *CacheService) InvalidateUserCache(ctx context.Context, userID int64) error {
	key := fmt.Sprintf("user:%d", userID)
	return s.Delete(ctx, key)
}

// ===================== 工具方法 =====================

// deleteByPattern 批量删除匹配 pattern 的 key（用于缓存失效）
func (s *CacheService) deleteByPattern(ctx context.Context, pattern string) error {
	if !s.enabled {
		return nil
	}
	var cursor uint64
	for {
		keys, nextCursor, err := s.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}
		if len(keys) > 0 {
			if err := s.client.Del(ctx, keys...).Err(); err != nil {
				return err
			}
		}
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
	return nil
}

// Shutdown 关闭 Redis 连接
func (s *CacheService) Shutdown() {
	if s.client != nil {
		s.client.Close()
	}
	log.Println("[Redis] 连接已关闭")
}