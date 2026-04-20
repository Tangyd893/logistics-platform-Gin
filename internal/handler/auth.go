package handler

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"logistics-platform-gin/internal/model"
	"logistics-platform-gin/pkg/response"
	"logistics-platform-gin/pkg/utils"
)

type AuthHandler struct{}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refreshToken"`
	ExpiresIn    int64        `json:"expiresIn"`
	UserInfo     *UserInfoVO  `json:"userInfo"`
}

type UserInfoVO struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	RoleCode    string `json:"roleCode"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "用户名和密码不能为空")
		return
	}

	var user model.SysUser
	if err := db.Where("username = ? AND deleted = false", req.Username).First(&user).Error; err != nil {
		response.Fail(c, 401, "用户名或密码错误")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		response.Fail(c, 401, "用户名或密码错误")
		return
	}

	expMs := int64(86400000) // 24h
	refreshExpMs := int64(604800000) // 7d

	token, err := utils.GenerateToken(user.Username, user.RoleCode, expMs)
	if err != nil {
		response.ServerError(c, "生成令牌失败")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.Username, refreshExpMs)
	if err != nil {
		response.ServerError(c, "生成刷新令牌失败")
		return
	}

	resp := LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresIn:    expMs / 1000,
		UserInfo: &UserInfoVO{
			Username:    user.Username,
			DisplayName: user.DisplayName,
			RoleCode:    user.RoleCode,
		},
	}
	response.OK(c, resp)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken := c.GetHeader("Refresh-Token")
	if refreshToken == "" {
		response.BadRequest(c, "Refresh-Token 不能为空")
		return
	}

	claims, err := utils.ParseToken(refreshToken)
	if err != nil {
		response.Fail(c, 401, "刷新令牌无效")
		return
	}

	var user model.SysUser
	if err := db.Where("username = ? AND deleted = false", claims.Subject).First(&user).Error; err != nil {
		response.Fail(c, 401, "用户不存在")
		return
	}

	token, _ := utils.GenerateToken(user.Username, user.RoleCode, 86400000)
	response.OK(c, gin.H{
		"token": token,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	username, _ := c.Get("username")
	var user model.SysUser
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		response.Fail(c, 404, "用户不存在")
		return
	}
	response.OK(c, UserInfoVO{
		Username:    user.Username,
		DisplayName: user.DisplayName,
		RoleCode:    user.RoleCode,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	response.OKMsg(c, "登出成功", nil)
}
