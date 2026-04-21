package handler

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"logistics-platform-gin/internal/model"
	"logistics-platform-gin/pkg/response"
)

type PageQuery struct {
	Page     int    `form:"page" json:"page"`
	PageSize int    `form:"pageSize" json:"pageSize"`
	Keyword  string `form:"keyword" json:"keyword"`
}

func parsePage(q *PageQuery) (int, int) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	return page, pageSize
}

func pageOffset(page, pageSize int) int {
	return (page - 1) * pageSize
}

// ==================== Order Handler ====================

type OrderHandler struct{}

type OrderQuery struct {
	Page         int     `form:"page"`
	PageSize     int     `form:"pageSize"`
	CustomerID   *int64  `form:"customerId"`
	Keyword      string  `form:"keyword"`
	Status       *int    `form:"status"`
	SenderName   string  `form:"senderName"`
	ReceiverName string  `form:"receiverName"`
}

func (h *OrderHandler) Page(c *gin.Context) {
	var q OrderQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	page, pageSize := parsePage(&PageQuery{Page: q.Page, PageSize: q.PageSize})

	query := db.Model(&model.OOrder{})
	if q.CustomerID != nil {
		query = query.Where("customer_id = ?", *q.CustomerID)
	}
	if q.Status != nil {
		query = query.Where("status = ?", *q.Status)
	}
	if q.Keyword != "" {
		query = query.Where("order_no LIKE ? OR sender_name LIKE ? OR receiver_name LIKE ?",
			"%"+q.Keyword+"%", "%"+q.Keyword+"%", "%"+q.Keyword+"%")
	}
	if q.SenderName != "" {
		query = query.Where("sender_name LIKE ?", "%"+q.SenderName+"%")
	}
	if q.ReceiverName != "" {
		query = query.Where("receiver_name LIKE ?", "%"+q.ReceiverName+"%")
	}

	var total int64
	query.Count(&total)

	var orders []model.OOrder
	query.Order("created_at DESC").
		Offset(pageOffset(page, pageSize)).
		Limit(pageSize).
		Find(&orders)

	// fill statusName
	for i := range orders {
		orders[i].StatusName = model.OrderStatusName(orders[i].Status)
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	response.OK(c, gin.H{
		"records":    orders,
		"total":      total,
		"page":       page,
		"size":       pageSize,
		"pages":      totalPages,
	})
}

func (h *OrderHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的订单ID")
		return
	}

	var order model.OOrder
	if err := db.First(&order, id).Error; err != nil {
		response.NotFound(c, "订单不存在")
		return
	}
	order.StatusName = model.OrderStatusName(order.Status)

	var items []model.OOrderItem
	db.Where("order_id = ?", id).Find(&items)

	var logs []model.OOrderStatusLog
	db.Where("order_id = ?", id).Order("operate_time ASC").Find(&logs)
	for i := range logs {
		logs[i].StatusName = model.OrderStatusName(logs[i].Status)
	}

	order.Items = items
	order.Logs = logs

	response.OK(c, order)
}

func (h *OrderHandler) GetByOrderNo(c *gin.Context) {
	orderNo := c.Param("orderNo")
	var order model.OOrder
	if err := db.Where("order_no = ?", orderNo).First(&order).Error; err != nil {
		response.NotFound(c, "订单不存在")
		return
	}
	order.StatusName = model.OrderStatusName(order.Status)
	response.OK(c, order)
}

type CreateOrderRequest struct {
	CustomerID      *int64            `json:"customerId"`
	SenderName      string           `json:"senderName" binding:"required"`
	SenderPhone     string           `json:"senderPhone" binding:"required"`
	SenderAddress   string           `json:"senderAddress" binding:"required"`
	ReceiverName    string           `json:"receiverName" binding:"required"`
	ReceiverPhone   string           `json:"receiverPhone" binding:"required"`
	ReceiverAddress string           `json:"receiverAddress" binding:"required"`
	TotalAmount     float64          `json:"totalAmount"`
	WeightKg        *float64         `json:"weightKg"`
	VolumeCbm       *float64         `json:"volumeCbm"`
	Remark          string           `json:"remark"`
	Items           []OrderItemInput `json:"items"`
}

type OrderItemInput struct {
	SkuName   string   `json:"skuName"`
	SkuCode   string   `json:"skuCode"`
	Quantity  int      `json:"quantity" binding:"required"`
	WeightKg  *float64 `json:"weightKg"`
	VolumeCbm *float64 `json:"volumeCbm"`
	UnitPrice *float64 `json:"unitPrice"`
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	orderNo := generateOrderNo()
	order := model.OOrder{
		OrderNo:         orderNo,
		CustomerID:      req.CustomerID,
		SenderName:      req.SenderName,
		SenderPhone:     req.SenderPhone,
		SenderAddress:   req.SenderAddress,
		ReceiverName:    req.ReceiverName,
		ReceiverPhone:   req.ReceiverPhone,
		ReceiverAddress: req.ReceiverAddress,
		TotalAmount:     req.TotalAmount,
		WeightKg:        req.WeightKg,
		VolumeCbm:        req.VolumeCbm,
		Status:          model.OrderStatusPending,
		Remark:          req.Remark,
	}

	if err := db.Create(&order).Error; err != nil {
		response.ServerError(c, "创建订单失败")
		return
	}

	// Save items
	for _, item := range req.Items {
		oi := model.OOrderItem{
			OrderID:   order.ID,
			SkuName:   item.SkuName,
			SkuCode:   item.SkuCode,
			Quantity:  item.Quantity,
			WeightKg:  item.WeightKg,
			VolumeCbm: item.VolumeCbm,
			UnitPrice: item.UnitPrice,
		}
		db.Create(&oi)
	}

	// Record status log
	log := model.OOrderStatusLog{
		OrderID:     order.ID,
		Status:      model.OrderStatusPending,
		OperateTime: order.CreatedAt,
		Remark:      "订单创建",
	}
	db.Create(&log)

	order.StatusName = model.OrderStatusName(order.Status)
	response.OK(c, order)
}

func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的订单ID")
		return
	}

	var req struct {
		Status int    `json:"status" binding:"required"`
		Remark string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "状态不能为空")
		return
	}

	var order model.OOrder
	if err := db.First(&order, id).Error; err != nil {
		response.NotFound(c, "订单不存在")
		return
	}

	if !validateStatusTransition(order.Status, req.Status) {
		response.Fail(c, 400, "不允许的状态转换")
		return
	}

	db.Model(&order).Updates(map[string]interface{}{
		"status": req.Status,
	})

	log := model.OOrderStatusLog{
		OrderID:     id,
		Status:      req.Status,
		OperateTime: order.CreatedAt,
		Remark:      req.Remark,
	}
	db.Create(&log)

	order.Status = req.Status
	order.StatusName = model.OrderStatusName(order.Status)
	response.OK(c, order)
}

func validateStatusTransition(old, new int) bool {
	switch old {
	case model.OrderStatusPending:
		return new == model.OrderStatusConfirmed || new == model.OrderStatusCancelled
	case model.OrderStatusConfirmed:
		return new == model.OrderStatusInWarehouse || new == model.OrderStatusCancelled
	case model.OrderStatusInWarehouse:
		return new == model.OrderStatusShipped || new == model.OrderStatusCancelled
	case model.OrderStatusShipped:
		return new == model.OrderStatusInTransit
	case model.OrderStatusInTransit:
		return new == model.OrderStatusDelivered || new == model.OrderStatusCompleted
	case model.OrderStatusDelivered:
		return new == model.OrderStatusCompleted
	}
	return false
}

func generateOrderNo() string {
	return fmt.Sprintf("ORD%s%04d",
		time.Now().Format("20060102150405"),
		int(time.Now().UnixNano()%10000))
}
