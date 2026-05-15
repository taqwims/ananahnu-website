package usecase

import (
	"ananahnu/internal/domain"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (uc *submissionWorkflowUsecase) Submit(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusDraft && sub.Status != domain.StatusRevision {
		return errors.New("submission is not in DRAFT or REVISION state")
	}

	// Auto-detect and fix DataSource if it was created as a stub
	if sub.DataSource == "" || sub.DataSource == "ORGANIK" {
		if userRole == "MARKETING" {
			sub.DataSource = "MARKETING"
			_ = uc.SubmissionRepo.UpdateDataSource(id, "MARKETING")
		}
	}

	// Transition: DRAFT -> WAITING_PAYMENT or VERVAL_PENDAMPING
	nextStatus := domain.StatusWaitingPayment
	if sub.ServiceType == "SELF_DECLARE" {
		nextStatus = domain.StatusVervalPendamping
	}

	if userRole == "MARKETING" {
		nextStatus = domain.StatusQCOfficer
	}

	// Generate tracking number if not exists
	if sub.TrackingNumber == nil || *sub.TrackingNumber == "" {
		now := time.Now()
		randomPart := strings.ToUpper(uuid.New().String()[:4])
		trackingNo := fmt.Sprintf("AN-%s-%s", now.Format("0601"), randomPart)
		_ = uc.SubmissionRepo.UpdateTrackingNumber(id, trackingNo)
		sub.TrackingNumber = &trackingNo
	}

	err = uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "SUBMIT", sub.Status, nextStatus, "")

		// Handle Invoices
		existingInvoices, _, err := uc.InvoiceRepo.FindAll(map[string]interface{}{
			"submission_id": id,
			"service_type":  sub.ServiceType,
		}, 1, 1)
		
		if err == nil && len(existingInvoices) == 0 {
			switch sub.ServiceType {
			case "SELF_DECLARE_MANDIRI":
				amount := 230000.0
				if setting, err := uc.SettingRepo.GetSetting("SD_MANDIRI_COST"); err == nil && setting != nil {
					if val, parseErr := strconv.ParseFloat(setting.Value, 64); parseErr == nil {
						amount = val
					}
				}
				uc.InvoiceRepo.Create(&domain.Invoice{
					SubmissionID: id,
					PayerID:      nil, 
					ServiceType:  "SELF_DECLARE_MANDIRI",
					Amount:       amount,
					Status:       domain.InvoiceStatusUnpaid,
					Notes:        "Pembayaran Awal SELF_DECLARE_MANDIRI",
				})
			case "REGULER":
				costDetail, _ := uc.BillingConfigRepo.GetSubmissionCostDetail(id)
				var amount float64
				if costDetail != nil && costDetail.TotalAmount > 0 {
					amount = costDetail.TotalAmount
				}
				uc.InvoiceRepo.Create(&domain.Invoice{
					SubmissionID:  id,
					PayerID:       nil,
					ServiceType:   "REGULER",
					Amount:        amount,
					Status:        domain.InvoiceStatusUnpaid,
					PricingSource: "COST_DETAIL",
					Notes:         "Full Payment Layanan Reguler",
				})
			}
		}
		
		// Notify Finance
		if nextStatus == domain.StatusWaitingPayment {
			users, _, _ := uc.UserRepo.FindAll(map[string]interface{}{}, 1, 100)
			for _, u := range users {
				if u.Role.Name == "FINANCE" || u.Role.Name == "ADMIN_KEUANGAN" {
					_ = uc.NotifUC.SendWorkflowNotification("payment_needed_internal", map[string]string{
						"business_name": sub.Client.BusinessName,
						"service_type":  sub.Client.ServiceType,
					}, u.Phone, &u.ID, id, "Tagihan Baru", fmt.Sprintf("Halo Finance, pengajuan baru dari *%s* (%s) menunggu konfirmasi pembayaran.", sub.Client.BusinessName, sub.Client.ServiceType))
				}
			}
		}

		// Notify Client
		trackingNo := ""
		if sub.TrackingNumber != nil {
			trackingNo = *sub.TrackingNumber
		}
		
		_ = uc.NotifUC.SendWorkflowNotification("submit", map[string]string{
			"client_name":     sub.Client.ClientName,
			"business_name":   sub.Client.BusinessName,
			"tracking_number": trackingNo,
		}, sub.Client.Phone, nil, id, "Pengajuan Diterima", fmt.Sprintf("Halo *%s*, pengajuan sertifikasi halal Anda untuk *%s* telah kami terima. No Tracking: *%s*.", sub.Client.ClientName, sub.Client.BusinessName, trackingNo))
	}
	return err
}

func (uc *submissionWorkflowUsecase) Approve(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	var nextStatus domain.SubmissionStatus
	var requiredRole string

	switch sub.Status {
	case domain.StatusWaitingPayment:
		requiredRole = "ADMIN"
		nextStatus = domain.StatusQCOfficer
		isPaid := false
		if sub.Invoice != nil && sub.Invoice.Status == domain.InvoiceStatusPaid {
			isPaid = true
		}
		if !isPaid {
			for _, p := range sub.Payments {
				if p.Status == domain.PaymentStatusPaid {
					isPaid = true
					break
				}
			}
		}
		if !isPaid {
			return errors.New("pengajuan belum lunas. Pembayaran harus dikonfirmasi terlebih dahulu")
		}
	case domain.StatusVervalPendamping:
		requiredRole = "HALAL_KONSULTAN"
		nextStatus = domain.StatusQCOfficer
		if sub.ServiceType == "REGULER" || sub.ServiceType == "SELF_DECLARE_MANDIRI" {
			isPaid := false
			if sub.Invoice != nil && sub.Invoice.Status == domain.InvoiceStatusPaid {
				isPaid = true
			}
			if !isPaid {
				for _, p := range sub.Payments {
					if p.Status == domain.PaymentStatusPaid {
						isPaid = true
						break
					}
				}
			}
			if !isPaid {
				nextStatus = domain.StatusWaitingPayment
			}
		}
	case domain.StatusQCOfficer:
		requiredRole = "QC_OFFICER"
		nextStatus = domain.StatusDrafter
	case domain.StatusDrafter:
		requiredRole = "DRAFTER"
		nextStatus = domain.StatusQCReview
		if sub.Client.NIB == "" || strings.HasPrefix(sub.Client.NIB, "DRAFT-") {
			return errors.New("NIB wajib diisi sebelum melanjutkan pengajuan")
		}
		if sub.ServiceType == "REGULER" && sub.AuditResult1URL == "" {
			return errors.New("file hasil audit wajib diunggah sebelum dikirim ke QC Review")
		}
	case domain.StatusQCReview:
		requiredRole = "QC_OFFICER"
		nextStatus = domain.StatusSidangFatwa
		if sub.Client.NIB == "" || strings.HasPrefix(sub.Client.NIB, "DRAFT-") {
			return errors.New("NIB wajib diisi sebelum melanjutkan ke Sidang Fatwa")
		}
	case domain.StatusSidangFatwa:
		return errors.New("terbit SH harus menyertakan file sertifikat. Gunakan fitur 'Terbitkan SH'")
	default:
		return errors.New("no approval action available for current status")
	}

	// Verifikator can only approve REGULER submissions when QC_OFFICER is required
	isVerifikatorAllowed := userRole == "VERIFIKATOR" && requiredRole == "QC_OFFICER" && sub.ServiceType == "REGULER"

	if userRole != requiredRole && userRole != "ADMIN" && userRole != "DIRECTOR" && !isVerifikatorAllowed {
		return fmt.Errorf("unauthorized: role %s cannot approve in status %s", userRole, sub.Status)
	}

	if sub.Status == domain.StatusQCOfficer && sub.DataSource == "MARKETING" && sub.ConsultantID == nil {
		return errors.New("pengajuan dari Marketing harus ditunjuk konsultan terlebih dahulu sebelum didistribusikan")
	}

	err = uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "APPROVE", sub.Status, nextStatus, "")
		if nextStatus == domain.StatusSHTerbit && sub.ServiceType == "SELF_DECLARE" {
			uc.generateSHTerbitInvoice(id, sub)
		}
	}
	return err
}

func (uc *submissionWorkflowUsecase) ApproveWithDrafter(id uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusQCOfficer {
		return errors.New("assign drafter only available when status is QC_OFFICER")
	}

	if userRole != "QC_OFFICER" && userRole != "ADMIN" && userRole != "DIRECTOR" && !(userRole == "VERIFIKATOR" && sub.ServiceType == "REGULER") {
		return fmt.Errorf("unauthorized: role %s cannot assign drafter", userRole)
	}

	if sub.DataSource == "MARKETING" && sub.ConsultantID == nil {
		return errors.New("pengajuan dari Marketing harus ditunjuk konsultan terlebih dahulu sebelum didistribusikan")
	}

	if err := uc.SubmissionRepo.UpdateAssignee(id, &drafterID); err != nil {
		return fmt.Errorf("failed to assign drafter: %w", err)
	}

	if err := uc.SubmissionRepo.UpdateStatus(id, domain.StatusDrafter, 0); err != nil {
		return err
	}

	uc.logChange(id, userID, "ASSIGN_DRAFTER", sub.Status, domain.StatusDrafter, "Assigned to drafter")

	drafter, _ := uc.UserRepo.FindByID(drafterID)
	if drafter != nil {
		_ = uc.NotifUC.SendWorkflowNotification("drafter_assigned", map[string]string{
			"drafter_name":  drafter.FullName,
			"business_name": sub.Client.BusinessName,
		}, drafter.Phone, &drafterID, id, "Penugasan Baru", "Anda ditugaskan untuk mengerjakan pengajuan "+sub.Client.BusinessName)
	}

	return nil
}

func (uc *submissionWorkflowUsecase) BulkApproveWithDrafter(ids []uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error {
	if userRole != "QC_OFFICER" && userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "VERIFIKATOR" {
		return errors.New("unauthorized: only QC_OFFICER/VERIFIKATOR can distribute submissions")
	}

	var errs []string
	for _, id := range ids {
		if err := uc.ApproveWithDrafter(id, userID, userRole, drafterID); err != nil {
			errs = append(errs, fmt.Sprintf("ID %s: %v", id, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("some distributions failed: %s", strings.Join(errs, "; "))
	}

	return nil
}

func (uc *submissionWorkflowUsecase) AssignConsultant(id uuid.UUID, userID uuid.UUID, userRole string, consultantID uuid.UUID) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "KOORDINATOR" && userRole != "QC_OFFICER" && userRole != "VERIFIKATOR" {
		return errors.New("unauthorized to assign consultant")
	}

	if sub.DataSource == "MARKETING" && userRole == "MARKETING" {
		return errors.New("marketing cannot assign their own consultant")
	}

	if err := uc.SubmissionRepo.UpdateConsultant(id, &consultantID); err != nil {
		return fmt.Errorf("failed to assign consultant: %w", err)
	}

	newStatus := sub.Status
	if sub.DataSource == "MARKETING" && sub.Status == domain.StatusQCOfficer {
		newStatus = domain.StatusVervalPendamping
		_ = uc.SubmissionRepo.UpdateStatus(id, newStatus, 0)
	}

	uc.logChange(id, userID, "ASSIGN_CONSULTANT", sub.Status, newStatus, "Assigned to consultant")

	consultant, _ := uc.UserRepo.FindByID(consultantID)
	if consultant != nil {
		_ = uc.NotifUC.SendWorkflowNotification("consultant_assigned", map[string]string{
			"consultant_name": consultant.FullName,
			"business_name":   sub.Client.BusinessName,
		}, consultant.Phone, &consultantID, id, "Penugasan Konsultan", "Anda ditunjuk sebagai konsultan untuk pengajuan "+sub.Client.BusinessName)
	}

	return nil
}

func (uc *submissionWorkflowUsecase) Reject(id uuid.UUID, userID uuid.UUID, userRole string, note string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	var nextStatus domain.SubmissionStatus
	switch sub.Status {
	case domain.StatusQCOfficer:
		nextStatus = domain.StatusVervalPendamping
	case domain.StatusDrafter:
		nextStatus = domain.StatusQCOfficer
	case domain.StatusQCReview:
		nextStatus = domain.StatusDrafter
	case domain.StatusSidangFatwa:
		nextStatus = domain.StatusDrafter
	default:
		nextStatus = domain.StatusRevision
	}

	err = uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "REJECT", sub.Status, nextStatus, note)
		_ = uc.SubmissionRepo.UpdateRejectNote(id, note)

		if sub.AssignedDrafterID != nil {
			drafter, _ := uc.UserRepo.FindByID(*sub.AssignedDrafterID)
			if drafter != nil {
				_ = uc.NotifUC.SendWorkflowNotification("revision_internal", map[string]string{
					"target_name":   drafter.FullName,
					"business_name": sub.Client.BusinessName,
					"note":          note,
				}, drafter.Phone, &drafter.ID, id, "Pengajuan Dikembalikan", "Pengajuan "+sub.Client.BusinessName+" dikembalikan: "+note)
			}
		}

		if sub.ConsultantID != nil {
			cons, _ := uc.UserRepo.FindByID(*sub.ConsultantID)
			if cons != nil {
				_ = uc.NotifUC.SendWorkflowNotification("revision_internal", map[string]string{
					"target_name":   cons.FullName,
					"business_name": sub.Client.BusinessName,
					"note":          note,
				}, cons.Phone, &cons.ID, id, "Catatan Revisi", "Pengajuan "+sub.Client.BusinessName+" memerlukan revisi: "+note)
			}
		}
	}
	return err
}

func (uc *submissionWorkflowUsecase) IssueSH(id uuid.UUID, userID uuid.UUID, shURL string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusSidangFatwa {
		return errors.New("cannot issue SH if not in SIDANG_FATWA status")
	}

	if err := uc.SubmissionRepo.UpdateSH(id, shURL); err != nil {
		return err
	}

	nextStatus := domain.StatusSHTerbit
	if err := uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
		return err
	}

	uc.logChange(id, userID, "ISSUE_SH", sub.Status, nextStatus, "Sertifikat Halal diterbitkan")
	
	// Notify Client
	_ = uc.NotifUC.SendWorkflowNotification("sh_issued", map[string]string{
		"client_name":   sub.Client.ClientName,
		"business_name": sub.Client.BusinessName,
	}, sub.Client.Phone, nil, id, "Sertifikat Halal Terbit", "Selamat! Sertifikat Halal untuk *"+sub.Client.BusinessName+"* telah terbit. Silakan cek portal Anda.")

	return nil
}

func (uc *submissionWorkflowUsecase) UpdateAuditInfo(id uuid.UUID, userID uuid.UUID, userRole string, auditDate *time.Time) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if userRole != "DRAFTER" && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return errors.New("unauthorized to update audit info")
	}

	if err := uc.SubmissionRepo.UpdateAuditInfo(id, auditDate); err != nil {
		return err
	}

	uc.logChange(id, userID, "UPDATE_AUDIT_INFO", sub.Status, sub.Status, "Audit date set to "+auditDate.Format("2006-01-02"))
	return nil
}

func (uc *submissionWorkflowUsecase) UpdateAuditResult(id uuid.UUID, userID uuid.UUID, userRole string, url1, url2 string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if userRole != "DRAFTER" && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return errors.New("unauthorized to upload audit result")
	}

	if err := uc.SubmissionRepo.UpdateAuditResult(id, url1, url2); err != nil {
		return err
	}

	uc.logChange(id, userID, "UPLOAD_AUDIT_RESULT", sub.Status, sub.Status, "Audit result files uploaded")
	return nil
}
