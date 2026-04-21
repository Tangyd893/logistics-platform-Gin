package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"logistics-platform-gin/internal/model"
)

func TestLoginRequest_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name       string
		body       map[string]string
		wantStatus int
	}{
		{
			name:       "empty body",
			body:       map[string]string{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "missing password",
			body:       map[string]string{"username": "admin"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "missing username",
			body:       map[string]string{"password": "admin123"},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.POST("/test", func(c *gin.Context) {
				var req LoginRequest
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
					return
				}
				c.JSON(http.StatusOK, gin.H{"ok": true})
			})

			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("POST", "/test", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("got status %d, want %d", w.Code, tt.wantStatus)
			}
		})
	}
}

func TestOrderStatusName(t *testing.T) {
	tests := []struct {
		code int
		desc string
	}{
		{10, "待确认"},
		{20, "已确认"},
		{30, "已入库"},
		{40, "已发货"},
		{50, "运输中"},
		{60, "已送达"},
		{70, "已完成"},
		{80, "已取消"},
		{99, "未知"},
	}

	for _, tt := range tests {
		name := model.OrderStatusName(tt.code)
		if name != tt.desc {
			t.Errorf("OrderStatusName(%d) = %q, want %q", tt.code, name, tt.desc)
		}
	}
}