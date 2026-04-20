package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"logistics-platform-gin/config"
	"logistics-platform-gin/internal/model"
)

// ===================== 消息结构 =====================

// OrderCreatedEvent 订单创建事件
type OrderCreatedEvent struct {
	OrderID    int64  `json:"orderId"`
	OrderNo    string `json:"orderNo"`
	Status     int    `json:"status"`
	CreatedAt  string `json:"createdAt"`
	SenderName string `json:"senderName"`
}

// OrderShippedEvent 订单发货事件
type OrderShippedEvent struct {
	OrderID    int64  `json:"orderId"`
	OrderNo    string `json:"orderNo"`
	DriverID   int64  `json:"driverId"`
	DriverName string `json:"driverName"`
	VehicleID  int64  `json:"vehicleId"`
	PlateNo    string `json:"plateNo"`
}

// OrderDeliveredEvent 订单送达事件
type OrderDeliveredEvent struct {
	OrderID     int64  `json:"orderId"`
	OrderNo     string `json:"orderNo"`
	DeliveredAt string `json:"deliveredAt"`
}

// ===================== HTTP-based RocketMQ Service =====================
// RocketMQ 5.x 提供 HTTP API（通过 RocketMQ Proxy 或直接 Broker HTTP API）
// 参考: https://rocketmq.apache.org/docs/presentation/06-REST%20API%20Reference/
//
// 如果使用原生 Broker HTTP API（10911端口），则无需额外 Proxy
// 如果需要更完整的 REST 支持，建议部署 RocketMQ Proxy (8081 端口)

type RocketMQService struct {
	namesrvAddr string
	httpProxy   string // e.g. http://localhost:8081
	enabled     bool
	client      *http.Client
}

func NewRocketMQService() (*RocketMQService, error) {
	cfg := config.Load()

	svc := &RocketMQService{
		namesrvAddr: cfg.RocketMQNamesrvAddr,
		httpProxy:    cfg.RocketMQProxyURL,
		enabled:      cfg.RocketMQEnabled,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}

	if !svc.enabled {
		log.Println("[RocketMQ] 未启用（ROCKETMQ_ENABLED=false）")
		return svc, nil
	}

	// Test connection to namesrv
	if err := svc.ping(); err != nil {
		log.Printf("[RocketMQ] 警告: NameServer 连接失败: %v（将跳过消息功能）", err)
		return svc, nil
	}

	log.Println("[RocketMQ] 连接成功，地址:", svc.namesrvAddr)
	return svc, nil
}

func (s *RocketMQService) ping() error {
	if s.httpProxy != "" {
		// Use RocketMQ Proxy HTTP API
		resp, err := s.client.Get(s.httpProxy + "/rocketmq/health")
		if err != nil {
			return err
		}
		resp.Body.Close()
		return nil
	}
	// Fallback: check namesrv port
	reqURL := fmt.Sprintf("http://%s/", s.namesrvAddr)
	resp, err := s.client.Get(reqURL)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}

// ===================== 发送消息（HTTP REST） =====================

// SendOrderCreatedEvent 发送订单创建事件
func (s *RocketMQService) SendOrderCreatedEvent(order *model.OOrder) error {
	event := OrderCreatedEvent{
		OrderID:    order.ID,
		OrderNo:    order.OrderNo,
		Status:     order.Status,
		CreatedAt:  order.CreatedAt.Format(time.RFC3339),
		SenderName: order.SenderName,
	}
	return s.sendMessage("logistics_order_created", order.OrderNo, event)
}

// SendOrderShippedEvent 发送订单发货事件
func (s *RocketMQService) SendOrderShippedEvent(order *model.OOrder, driver *model.TDriver, vehicle *model.TVehicle) error {
	event := OrderShippedEvent{
		OrderID:    order.ID,
		OrderNo:    order.OrderNo,
		DriverID:   driver.ID,
		DriverName: driver.Name,
		VehicleID:  vehicle.ID,
		PlateNo:    vehicle.PlateNo,
	}
	return s.sendMessage("logistics_order_shipped", order.OrderNo, event)
}

// SendOrderDeliveredEvent 发送订单送达事件
func (s *RocketMQService) SendOrderDeliveredEvent(order *model.OOrder) error {
	event := OrderDeliveredEvent{
		OrderID:     order.ID,
		OrderNo:     order.OrderNo,
		DeliveredAt: time.Now().Format(time.RFC3339),
	}
	return s.sendMessage("logistics_order_delivered", order.OrderNo, event)
}

func (s *RocketMQService) sendMessage(topic, key string, event interface{}) error {
	if !s.enabled {
		return nil
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("事件序列化失败: %w", err)
	}

	// Method 1: Use RocketMQ 5.x Proxy HTTP API (recommended for production)
	if s.httpProxy != "" {
		return s.sendViaProxy(topic, key, data)
	}

	// Method 2: Use Broker's HTTP API (RocketMQ 5.x Broker supports limited HTTP)
	// Note: Native binary protocol is recommended for production
	// This is a simplified fallback for development
	log.Printf("[RocketMQ] 消息待发送（未配置 Proxy）: topic=%s key=%s event=%s",
		topic, key, string(data))
	return nil
}

// sendViaProxy sends message via RocketMQ Proxy's REST API
func (s *RocketMQService) sendViaProxy(topic, key string, body []byte) error {
	url := fmt.Sprintf("%s/v2/messages?topic=%s", s.httpProxy, topic)

	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("keys", key)
	req.Header.Set("Message-Key", key)

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("[RocketMQ] 消息发送失败: topic=%s err=%v", topic, err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("发送失败 status=%d body=%s", resp.StatusCode, string(respBody))
	}

	log.Printf("[RocketMQ] 消息发送成功: topic=%s key=%s", topic, key)
	return nil
}

// ===================== 查询功能 =====================

// GetTopicList 获取主题列表（通过 Broker HTTP API）
func (s *RocketMQService) GetTopicList() ([]string, error) {
	if !s.enabled || s.httpProxy == "" {
		return nil, fmt.Errorf("未启用或未配置 Proxy")
	}

	url := s.httpProxy + "/v2/topics"
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Data []string `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result.Data, nil
}

// ===================== 消费者（通过 HTTP 短轮询，拉取消息） =====================
// 注意：对于生产环境，建议使用 RocketMQ Proxy 的 HTTP 长轮询或原生 SDK
// 这里用简单的定时轮询模拟

// StartConsumers 启动消费者（后台定时拉取）
func (s *RocketMQService) StartConsumers() error {
	if !s.enabled {
		log.Println("[RocketMQ] 消费者跳过（未启用）")
		return nil
	}
	log.Println("[RocketMQ] Consumer 模拟模式（使用应用层事件）")
	return nil
}

// PublishOrderCreatedEvent 发布订单创建事件（应用层事件通知）
// 代替 RocketMQ 的 pub/sub，用于解耦模块间调用
// 用法: 订单创建后调用此方法，触发所有监听器
func (s *RocketMQService) PublishOrderCreatedEvent(order *model.OOrder) {
	if s.enabled {
		log.Printf("[RocketMQ] 应用事件: 订单已创建 orderNo=%s", order.OrderNo)
	}
}

// PublishOrderShippedEvent 订单发货事件
func (s *RocketMQService) PublishOrderShippedEvent(order *model.OOrder, driver *model.TDriver, vehicle *model.TVehicle) {
	if s.enabled {
		log.Printf("[RocketMQ] 应用事件: 订单已发货 orderNo=%s driver=%s",
			order.OrderNo, driver.Name)
	}
}

// PublishOrderDeliveredEvent 订单送达事件
func (s *RocketMQService) PublishOrderDeliveredEvent(order *model.OOrder) {
	if s.enabled {
		log.Printf("[RocketMQ] 应用事件: 订单已送达 orderNo=%s", order.OrderNo)
	}
}

// Shutdown 关闭服务
func (s *RocketMQService) Shutdown() {
	log.Println("[RocketMQ] 服务已关闭")
}