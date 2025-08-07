package activities

import (
	"context"
	"fmt"
	"time"

	"email-tracking-server/pkg/logger"
	"github.com/resend/resend-go/v2"
	"go.temporal.io/sdk/activity"
)

type EmailActivity struct {
	resendClient *resend.Client
	fromEmail    string
	logger       *logger.Logger
}

type EmailData struct {
	ID          string                 `json:"id"`
	UserID      string                 `json:"userId"`
	TenantID    string                 `json:"tenantId"`
	EmailID     string                 `json:"emailId"`
	Status      string                 `json:"status"`
	Timestamp   time.Time              `json:"timestamp"`
	Workflow    string                 `json:"temporalWorkflow,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type SendEmailRequest struct {
	To       string `json:"to"`
	Subject  string `json:"subject"`
	Content  string `json:"content"`
	Priority string `json:"priority"`
	Template string `json:"template"`
}

type SendEmailResult struct {
	EmailID     string    `json:"emailId"`
	ResendID    string    `json:"resendId"`
	Status      string    `json:"status"`
	SentAt      time.Time `json:"sentAt"`
	Error       string    `json:"error,omitempty"`
}

func NewEmailActivity(apiKey string, fromEmail string, log *logger.Logger) *EmailActivity {
	resendClient := resend.NewClient(apiKey)
	
	return &EmailActivity{
		resendClient: resendClient,
		fromEmail:    fromEmail,
		logger:       log,
	}
}

func (ea *EmailActivity) SendEmail(ctx context.Context, emailData EmailData) (*SendEmailResult, error) {
	logger := ea.logger.WithEmail(emailData.EmailID).WithContext(ctx)
	logger.Info("Starting email send activity", "recipient", emailData.Metadata["recipient"])

	// Extract email details from metadata
	recipient, ok := emailData.Metadata["recipient"].(string)
	if !ok || recipient == "" {
		err := fmt.Errorf("recipient not found or invalid in metadata")
		logger.Error("Invalid recipient", "error", err)
		return &SendEmailResult{
			EmailID: emailData.EmailID,
			Status:  "failed",
			SentAt:  time.Now(),
			Error:   err.Error(),
		}, err
	}

	subject, ok := emailData.Metadata["subject"].(string)
	if !ok || subject == "" {
		err := fmt.Errorf("subject not found or invalid in metadata")
		logger.Error("Invalid subject", "error", err)
		return &SendEmailResult{
			EmailID: emailData.EmailID,
			Status:  "failed",
			SentAt:  time.Now(),
			Error:   err.Error(),
		}, err
	}

	content, ok := emailData.Metadata["content"].(string)
	if !ok || content == "" {
		err := fmt.Errorf("content not found or invalid in metadata")
		logger.Error("Invalid content", "error", err)
		return &SendEmailResult{
			EmailID: emailData.EmailID,
			Status:  "failed",
			SentAt:  time.Now(),
			Error:   err.Error(),
		}, err
	}

	// Get template type and priority if available
	templateType, _ := emailData.Metadata["templateType"].(string)
	priority, _ := emailData.Metadata["priority"].(string)

	logger.Info("Sending email via Resend", 
		"to", recipient, 
		"subject", subject,
		"template", templateType,
		"priority", priority)

	// Create email request for Resend
	params := &resend.SendEmailRequest{
		From:    ea.fromEmail,
		To:      []string{recipient},
		Subject: subject,
		Html:    ea.formatEmailContent(content, templateType),
	}

	// Add activity heartbeat for long-running operations
	activity.RecordHeartbeat(ctx, "Sending email via Resend")

	// Send email via Resend
	sent, err := ea.resendClient.Emails.Send(params)
	if err != nil {
		logger.Error("Failed to send email via Resend", "error", err)
		return &SendEmailResult{
			EmailID: emailData.EmailID,
			Status:  "failed",
			SentAt:  time.Now(),
			Error:   err.Error(),
		}, err
	}

	logger.Info("Successfully sent email via Resend", 
		"resend_id", sent.Id,
		"recipient", recipient)

	return &SendEmailResult{
		EmailID:  emailData.EmailID,
		ResendID: sent.Id,
		Status:   "sent",
		SentAt:   time.Now(),
	}, nil
}

func (ea *EmailActivity) formatEmailContent(content, templateType string) string {
	// Basic HTML formatting based on template type
	switch templateType {
	case "marketing":
		return fmt.Sprintf(`
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 20px; text-align: center;">
					<h1 style="color: white; margin: 0;">📧 Marketing Email</h1>
				</div>
				<div style="padding: 30px; background: #f9f9f9;">
					<div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						%s
					</div>
				</div>
				<div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
					Sent via Authentik Email Campaign System
				</div>
			</body>
			</html>
		`, content)
	case "transactional":
		return fmt.Sprintf(`
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="border-left: 4px solid #4CAF50; padding: 20px;">
					<h2 style="color: #333; margin-top: 0;">🔄 Transaction Notification</h2>
					<div style="line-height: 1.6; color: #666;">
						%s
					</div>
				</div>
			</body>
			</html>
		`, content)
	case "newsletter":
		return fmt.Sprintf(`
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background: #2196F3; color: white; padding: 20px; text-align: center;">
					<h1 style="margin: 0;">📰 Newsletter</h1>
				</div>
				<div style="padding: 20px; background: white;">
					%s
				</div>
			</body>
			</html>
		`, content)
	case "notification":
		return fmt.Sprintf(`
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background: #FF9800; color: white; padding: 15px; border-radius: 4px;">
					<h3 style="margin: 0;">🔔 Notification</h3>
				</div>
				<div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
					%s
				</div>
			</body>
			</html>
		`, content)
	default:
		return fmt.Sprintf(`
			<html>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
				%s
			</body>
			</html>
		`, content)
	}
}
