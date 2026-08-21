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

	// Transition: DRAFT -> WAITING_ASSIGNMENT or WAITING_PAYMENT or VERVAL_PENDAMPING
	var nextStatus domain.SubmissionStatus
	if sub.ConsultantID == nil {
		nextStatus = domain.StatusWaitingAssignment
	} else {
		nextStatus = domain.StatusWaitingPayment
		if sub.ServiceType == "SELF_DECLARE" {
			nextStatus = domain.StatusVervalPendamping
		}
	}

	if userRole == "MARKETING" || (sub.DataSource == "TELEMARKETING" && sub.ServiceType == "SELF_DECLARE") {
		if sub.ConsultantID != nil {
			nextStatus = domain.StatusVervalPendamping
		} else {
			nextStatus = domain.StatusWaitingAssignment
		}
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
				if err := uc.InvoiceRepo.Create(&domain.Invoice{
					SubmissionID: id,
					PayerID:      nil,
					ServiceType:  "SELF_DECLARE_MANDIRI",
					Type:         domain.InvoiceTypeFull,
					Amount:       amount,
					Status:       domain.InvoiceStatusUnpaid,
					Notes:        "Pembayaran Penuh SELF_DECLARE_MANDIRI",
				}); err != nil {
					return err
				}
			case "REGULER":
				costDetail, _ := uc.BillingConfigRepo.GetSubmissionCostDetail(id)
				var totalAmount float64
				if costDetail != nil && costDetail.TotalAmount > 0 {
					totalAmount = costDetail.TotalAmount
				}
				// DP = 70% dari total biaya
				dpAmount := totalAmount * 0.70
				if err := uc.InvoiceRepo.Create(&domain.Invoice{
					SubmissionID:  id,
					PayerID:       nil,
					ServiceType:   "REGULER",
					Type:          domain.InvoiceTypeDP,
					Amount:        dpAmount,
					Status:        domain.InvoiceStatusUnpaid,
					PricingSource: "COST_DETAIL",
					Notes:         "Down Payment 70% Layanan Reguler",
				}); err != nil {
					return err
				}
			}
		}
		
		// Notify Finance
		if nextStatus == domain.StatusWaitingPayment {
			users, _, _ := uc.UserRepo.FindAll(map[string]interface{}{}, 1, 100)
			for _, u := range users {
				if u.Role.Name == "ADMIN_KEUANGAN" {
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
	case domain.StatusWaitingAssignment:
		return errors.New("pengajuan menunggu penugasan pendamping halal oleh Marketing")
	case domain.StatusWaitingPayment:
		requiredRole = "ADMIN"
		nextStatus = domain.StatusVervalPendamping
		if sub.ConsultantID == nil {
			nextStatus = domain.StatusWaitingAssignment
		}
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
		requiredRole = "HALAL_ADVISOR"
		nextStatus = domain.StatusReviewSJPHClient
	case domain.StatusReviewSJPHClient:
		requiredRole = "CLIENT"
		nextStatus = domain.StatusQCOfficer
	case domain.StatusQCOfficer:
		requiredRole = "QC_OFFICER"
		nextStatus = domain.StatusDrafter
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
		nextStatus = domain.StatusSubmittedBPJPH
		if sub.Client.NIB == "" || strings.HasPrefix(sub.Client.NIB, "DRAFT-") {
			return errors.New("NIB wajib diisi sebelum dikirim ke BPJPH")
		}
	case domain.StatusSubmittedBPJPH:
		requiredRole = "ADMIN_KEUANGAN"
		nextStatus = domain.StatusSHTerbit
	case domain.StatusSidangFatwa:
		return errors.New("terbit SH harus menyertakan file sertifikat. Gunakan fitur 'Terbitkan SH'")
	default:
		return errors.New("no approval action available for current status")
	}

	if userRole != requiredRole && !(requiredRole == "QC_OFFICER" && userRole == "VERIFIKATOR") && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return fmt.Errorf("unauthorized: role %s cannot approve in status %s", userRole, sub.Status)
	}

	if sub.Status == domain.StatusQCOfficer && (sub.DataSource == "MARKETING" || (sub.DataSource == "TELEMARKETING" && sub.ServiceType == "SELF_DECLARE")) && sub.ConsultantID == nil {
		return errors.New("pengajuan dari Marketing / Telemarketing (Self Declare) harus ditunjuk advisor terlebih dahulu sebelum didistribusikan")
	}

	err = uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		uc.logChange(id, userID, "APPROVE", sub.Status, nextStatus, "")
		if nextStatus == domain.StatusSHTerbit && sub.ServiceType == "SELF_DECLARE" {
			uc.generateSHTerbitInvoice(id, sub)
		}

		// Notifications
		if nextStatus == domain.StatusWaitingPayment {
			// Notify Finance
			financeUsers, _, _ := uc.UserRepo.FindAll(map[string]interface{}{}, 1, 100)
			for _, u := range financeUsers {
				if u.Role.Name == "ADMIN_KEUANGAN" {
					_ = uc.NotifUC.SendWorkflowNotification("payment_needed_internal", map[string]string{
						"business_name": sub.Client.BusinessName,
						"service_type":  sub.Client.ServiceType,
					}, u.Phone, &u.ID, id, "Tagihan Baru", fmt.Sprintf("Halo Finance, pengajuan dari *%s* (%s) menunggu pembayaran.", sub.Client.BusinessName, sub.Client.ServiceType))
				}
			}

			// Notify Client
			_ = uc.NotifUC.SendWorkflowNotification("payment_needed", map[string]string{
				"client_name":   sub.Client.ClientName,
				"business_name": sub.Client.BusinessName,
			}, sub.Client.Phone, nil, id, "Menunggu Pembayaran", fmt.Sprintf("Halo *%s*, pengajuan Anda untuk *%s* telah disetujui dan menunggu pembayaran. Silakan cek dashboard Anda untuk rincian tagihan.", sub.Client.ClientName, sub.Client.BusinessName))
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
		return uc.Approve(id, userID, userRole)
	}

	if userRole != "QC_OFFICER" && userRole != "VERIFIKATOR" && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return fmt.Errorf("unauthorized: role %s cannot assign drafter", userRole)
	}

	if (sub.DataSource == "MARKETING" || (sub.DataSource == "TELEMARKETING" && sub.ServiceType == "SELF_DECLARE")) && sub.ConsultantID == nil {
		return errors.New("pengajuan dari Marketing / Telemarketing (Self Declare) harus ditunjuk advisor terlebih dahulu sebelum didistribusikan")
	}

	if err := uc.SubmissionRepo.UpdateAssignee(id, &drafterID); err != nil {
		return fmt.Errorf("failed to assign drafter: %w", err)
	}

	if err := uc.SubmissionRepo.UpdateStatus(id, domain.StatusDrafter, 0); err == nil {
		uc.logChange(id, userID, "ASSIGN_DRAFTER", sub.Status, domain.StatusDrafter, "")
		
		// Notify Drafter
		drafter, _ := uc.UserRepo.FindByID(drafterID)
		if drafter != nil {
			_ = uc.NotifUC.SendWorkflowNotification("drafter_assigned", map[string]string{
				"drafter_name":  drafter.FullName,
				"business_name": sub.Client.BusinessName,
			}, drafter.Phone, &drafter.ID, id, "Tugas Drafting Baru", fmt.Sprintf("Halo *%s*, Anda telah ditunjuk sebagai Drafter untuk pengajuan *%s*. Silakan cek workspace Anda.", drafter.FullName, sub.Client.BusinessName))
		}
	}
	return nil
}

func (uc *submissionWorkflowUsecase) BulkApproveWithDrafter(ids []uuid.UUID, userID uuid.UUID, userRole string, drafterID uuid.UUID) error {
	if userRole != "QC_OFFICER" && userRole != "VERIFIKATOR" && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return errors.New("unauthorized: only QC_OFFICER or VERIFIKATOR can distribute submissions")
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

	if userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "HALAL_MANAGER" && userRole != "HALAL_DIRECTOR" && userRole != "QC_OFFICER" && userRole != "VERIFIKATOR" && userRole != "MARKETING" && userRole != "MANAGER" {
		return errors.New("unauthorized to assign consultant")
	}

	if err := uc.SubmissionRepo.UpdateConsultant(id, &consultantID); err != nil {
		return fmt.Errorf("failed to assign consultant: %w", err)
	}

	newStatus := sub.Status
	if sub.Status == domain.StatusWaitingAssignment || sub.Status == domain.StatusDraft {
		newStatus = domain.StatusVervalPendamping
		_ = uc.SubmissionRepo.UpdateStatus(id, newStatus, 0)
	} else if (sub.DataSource == "MARKETING" || (sub.DataSource == "TELEMARKETING" && sub.ServiceType == "SELF_DECLARE")) && sub.Status == domain.StatusQCOfficer {
		newStatus = domain.StatusVervalPendamping
		_ = uc.SubmissionRepo.UpdateStatus(id, newStatus, 0)
	}

	uc.logChange(id, userID, "ASSIGN_CONSULTANT", sub.Status, newStatus, "Assigned to consultant")

	consultant, _ := uc.UserRepo.FindByID(consultantID)
	if consultant != nil {
		_ = uc.NotifUC.SendWorkflowNotification("consultant_assigned", map[string]string{
			"consultant_name": consultant.FullName,
			"business_name":   sub.Client.BusinessName,
		}, consultant.Phone, &consultantID, id, "Penugasan Advisor", "Anda ditunjuk sebagai advisor untuk pengajuan "+sub.Client.BusinessName)
	}

	return nil
}

func (uc *submissionWorkflowUsecase) SubmitSJPH(id uuid.UUID, userID uuid.UUID, userRole string, sjphURL string, notes string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if userRole != "HALAL_ADVISOR" && userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "QC_OFFICER" && userRole != "HALAL_MANAGER" {
		return fmt.Errorf("unauthorized: role %s cannot submit SJPH document", userRole)
	}

	if strings.TrimSpace(sjphURL) != "" || strings.TrimSpace(notes) != "" {
		_ = uc.SubmissionRepo.UpdateSJPH(id, sjphURL, notes)
	}

	nextStatus := domain.StatusReviewSJPHClient
	if err := uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
		return err
	}

	uc.logChange(id, userID, "SUBMIT_SJPH", sub.Status, nextStatus, "Dokumen SJPH diserahkan ke Pelaku Usaha: "+notes)

	// Notify Client
	_ = uc.NotifUC.SendWorkflowNotification("sjph_submitted_client", map[string]string{
		"client_name":   sub.Client.ClientName,
		"business_name": sub.Client.BusinessName,
	}, sub.Client.Phone, nil, id, "Dokumen SJPH Siap Ditinjau", "Halo *"+sub.Client.ClientName+"*, Pendamping Halal telah menyerahkan Dokumen SJPH untuk usaha *"+sub.Client.BusinessName+"*. Silakan login ke portal Anda untuk memeriksa dan menyetujui dokumen.")

	return nil
}

func (uc *submissionWorkflowUsecase) ApproveSJPH(id uuid.UUID, userID uuid.UUID, userRole string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if userRole != "CLIENT" && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return fmt.Errorf("unauthorized: role %s cannot approve SJPH document", userRole)
	}

	if sub.Status != domain.StatusReviewSJPHClient && sub.Status != domain.StatusVervalPendamping {
		return errors.New("dokumen SJPH belum diserahkan untuk persetujuan")
	}

	if err := uc.SubmissionRepo.ApproveSJPH(id, userID); err != nil {
		return err
	}

	nextStatus := domain.StatusQCOfficer
	if err := uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
		return err
	}

	uc.logChange(id, userID, "APPROVE_SJPH", sub.Status, nextStatus, "Persetujuan Dokumen SJPH oleh Pelaku Usaha")

	// Notify QC / Operational Manager
	qcUsers, _, _ := uc.UserRepo.FindAll(map[string]interface{}{}, 1, 100)
	for _, u := range qcUsers {
		if u.Role.Name == "QC_OFFICER" || u.Role.Name == "VERIFIKATOR" || u.Role.Name == "MANAGER" {
			_ = uc.NotifUC.SendWorkflowNotification("sjph_approved_internal", map[string]string{
				"business_name": sub.Client.BusinessName,
			}, u.Phone, &u.ID, id, "SJPH Disetujui Pelaku Usaha", "Halo Tim Operasional, Dokumen SJPH untuk *"+sub.Client.BusinessName+"* telah disetujui Pelaku Usaha dan masuk ke antrean Ruang Kerja QC.")
		}
	}

	return nil
}

func (uc *submissionWorkflowUsecase) Reject(id uuid.UUID, userID uuid.UUID, userRole string, input RejectInput) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	var nextStatus domain.SubmissionStatus

	if input.TargetStatus != "" {
		nextStatus = domain.SubmissionStatus(input.TargetStatus)
	} else {
		switch sub.Status {
		case domain.StatusQCOfficer:
			nextStatus = domain.StatusVervalPendamping
		case domain.StatusDrafter:
			nextStatus = domain.StatusQCOfficer
		case domain.StatusQCReview:
			if sub.AssignedDrafterID != nil {
				nextStatus = domain.StatusDrafter
			} else {
				nextStatus = domain.StatusQCOfficer
			}
		case domain.StatusSubmittedBPJPH, domain.StatusSidangFatwa:
			if sub.AssignedDrafterID != nil {
				nextStatus = domain.StatusDrafter
			} else {
				nextStatus = domain.StatusVervalPendamping
			}
		default:
			nextStatus = domain.StatusRevision
		}
	}

	// Format full note including invalid fields if provided
	fullNote := input.Note
	if len(input.InvalidFields) > 0 {
		invalidHeader := "[Bagian Bermasalah: " + strings.Join(input.InvalidFields, ", ") + "]"
		if fullNote != "" {
			fullNote = invalidHeader + "\n" + fullNote
		} else {
			fullNote = invalidHeader
		}
	}

	err = uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0)
	if err == nil {
		_ = uc.SubmissionRepo.UpdateHasBeenReturned(id, true)
		uc.logChange(id, userID, "REJECT", sub.Status, nextStatus, fullNote)
		_ = uc.SubmissionRepo.UpdateRejectNote(id, fullNote)

		// Notify Drafter if target is Drafter or assigned
		if sub.AssignedDrafterID != nil && (nextStatus == domain.StatusDrafter || nextStatus == domain.StatusQCReview) {
			drafter, _ := uc.UserRepo.FindByID(*sub.AssignedDrafterID)
			if drafter != nil {
				_ = uc.NotifUC.SendWorkflowNotification("revision_internal", map[string]string{
					"drafter_name":  drafter.FullName,
					"business_name": sub.Client.BusinessName,
					"note":          fullNote,
				}, drafter.Phone, &drafter.ID, id, "Pengajuan Dikembalikan (Revisi Drafter)", "Pengajuan "+sub.Client.BusinessName+" dikembalikan ke Anda: "+fullNote)
			}
		}

		// Notify Client
		_ = uc.NotifUC.SendWorkflowNotification("revision_client", map[string]string{
			"client_name":   sub.Client.ClientName,
			"business_name": sub.Client.BusinessName,
			"note":          fullNote,
		}, sub.Client.Phone, nil, id, "Catatan Revisi", "Halo *"+sub.Client.ClientName+"*, pengajuan Anda untuk *"+sub.Client.BusinessName+"* memerlukan revisi: "+fullNote)

		// Notify Advisor
		if sub.ConsultantID != nil {
			cons, _ := uc.UserRepo.FindByID(*sub.ConsultantID)
			if cons != nil {
				_ = uc.NotifUC.SendWorkflowNotification("revision_internal", map[string]string{
					"target_name":   cons.FullName,
					"business_name": sub.Client.BusinessName,
					"note":          fullNote,
				}, cons.Phone, &cons.ID, id, "Catatan Revisi Advisor", "Pengajuan "+sub.Client.BusinessName+" memerlukan revisi: "+fullNote)
			}
		}
	}
	return err
}

func (uc *submissionWorkflowUsecase) IssueSH(id uuid.UUID, userID uuid.UUID, shURL string) error {
	if strings.TrimSpace(shURL) == "" {
		return errors.New("file Sertifikat Halal wajib diunggah sebelum menerbitkan SH")
	}

	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusSidangFatwa && sub.Status != domain.StatusSubmittedBPJPH {
		return errors.New("cannot issue SH if not in SIDANG_FATWA or SUBMITTED_TO_BPJPH status")
	}

	if err := uc.SubmissionRepo.UpdateSH(id, shURL); err != nil {
		return err
	}

	nextStatus := domain.StatusSHTerbit
	if err := uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
		return err
	}

	uc.logChange(id, userID, "ISSUE_SH", sub.Status, nextStatus, "Sertifikat Halal diterbitkan")

	// Untuk REGULER: buat invoice Pelunasan 30% jika belum ada
	if sub.ServiceType == "REGULER" {
		// Cek dulu apakah klien sudah pilih Full Payment (DP invoice di-switch ke FULL)
		dpInvoice, dpErr := uc.InvoiceRepo.FindBySubmissionIDAndType(id, domain.InvoiceTypeDP)
		fullInvoice, fullErr := uc.InvoiceRepo.FindBySubmissionIDAndType(id, domain.InvoiceTypeFull)

		isFullPaymentMode := (fullErr == nil && fullInvoice != nil) ||
			(dpErr == nil && dpInvoice != nil && dpInvoice.Type == domain.InvoiceTypeFull)

		if isFullPaymentMode {
			// Klien sudah bayar lunas di awal, tidak perlu pelunasan
		} else {
			// Mode DP: buat invoice pelunasan 30% jika belum ada
			if _, err := uc.InvoiceRepo.FindBySubmissionIDAndType(id, domain.InvoiceTypePelunasan); err != nil {
				var pelunasanAmount float64
				if dpErr == nil && dpInvoice != nil {
					totalAmount := dpInvoice.Amount / 0.70
					pelunasanAmount = totalAmount * 0.30
				} else {
					if costDetail, err := uc.BillingConfigRepo.GetSubmissionCostDetail(id); err == nil && costDetail != nil {
						pelunasanAmount = costDetail.TotalAmount * 0.30
					}
				}
				if pelunasanAmount > 0 {
					_ = uc.InvoiceRepo.Create(&domain.Invoice{
						SubmissionID:  id,
						PayerID:       nil, // default to client/pemilik usaha
						ServiceType:   "REGULER",
						Type:          domain.InvoiceTypePelunasan,
						Amount:        pelunasanAmount,
						Status:        domain.InvoiceStatusUnpaid,
						PricingSource: "COST_DETAIL",
						Notes:         "Pelunasan 30% Layanan Reguler (wajib lunas untuk unduh SH)",
					})
				}
			}
		}
	} else if sub.ServiceType == "SELF_DECLARE" || sub.ServiceType == "SELF_DECLARE_MANDIRI" {
		// Buat invoice Full untuk agen/fasilitator
		if _, err := uc.InvoiceRepo.FindBySubmissionIDAndType(id, domain.InvoiceTypeFull); err != nil {
			configs, err := uc.PaymentConfigRepo.FindByServiceType("SELF_DECLARE_MANDIRI")
			var totalAmount float64
			if err == nil {
				for _, c := range configs {
					if c.IsActive {
						totalAmount += c.Amount
					}
				}
			}
			
			if totalAmount > 0 {
				var payerID *uuid.UUID
				if sub.Client.FacilitatorID != uuid.Nil {
					payerID = &sub.Client.FacilitatorID
				}
				_ = uc.InvoiceRepo.Create(&domain.Invoice{
					SubmissionID:  id,
					PayerID:       payerID,
					ServiceType:   sub.ServiceType,
					Type:          domain.InvoiceTypeFull,
					Amount:        totalAmount,
					Status:        domain.InvoiceStatusUnpaid,
					PricingSource: "SELF_DECLARE_MANDIRI",
					Notes:         "Tagihan Self Declare (terbit SH)",
				})
			}
		}
	}

	// Notify Client
	trackingNo := ""
	if sub.TrackingNumber != nil {
		trackingNo = *sub.TrackingNumber
	}
	_ = uc.NotifUC.SendWorkflowNotification("sh_terbit_client", map[string]string{
		"client_name":     sub.Client.ClientName,
		"business_name":   sub.Client.BusinessName,
		"tracking_number": trackingNo,
	}, sub.Client.Phone, nil, id, "Sertifikat Halal Terbit", "Selamat! Sertifikat Halal untuk *"+sub.Client.BusinessName+"* telah terbit. Silakan cek portal Anda.")

	// Notify Consultant
	if sub.ConsultantID != nil {
		cons, _ := uc.UserRepo.FindByID(*sub.ConsultantID)
		if cons != nil {
			_ = uc.NotifUC.SendWorkflowNotification("sh_terbit_internal", map[string]string{
				"consultant_name": cons.FullName,
				"business_name":   sub.Client.BusinessName,
			}, cons.Phone, &cons.ID, id, "Sertifikat Halal Terbit", "Sertifikat Halal untuk *"+sub.Client.BusinessName+"* telah terbit.")
		}
	}

	return nil
}

func (uc *submissionWorkflowUsecase) RevokeSH(id uuid.UUID, userID uuid.UUID, userRole string, note string) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if sub.Status != domain.StatusSHTerbit {
		return errors.New("hanya pengajuan berstatus SH_TERBIT yang dapat dibatalkan penerbitannya")
	}

	if userRole != "ADMIN_KEUANGAN" && userRole != "FINANCE" && userRole != "LEGAL" && userRole != "ADMIN" && userRole != "DIRECTOR" && userRole != "MANAGER" {
		return errors.New("unauthorized: role Anda tidak memiliki wewenang untuk membatalkan penerbitan SH")
	}

	// Reset SH URL
	if err := uc.SubmissionRepo.UpdateSH(id, ""); err != nil {
		return err
	}

	// Rollback status to SUBMITTED_TO_BPJPH
	nextStatus := domain.StatusSubmittedBPJPH
	if err := uc.SubmissionRepo.UpdateStatus(id, nextStatus, 0); err != nil {
		return err
	}

	revokeReason := "Penerbitan SH dibatalkan / direvisi"
	if note != "" {
		revokeReason = note
	}

	_ = uc.SubmissionRepo.UpdateRejectNote(id, revokeReason)
	uc.logChange(id, userID, "REVOKE_SH", sub.Status, nextStatus, revokeReason)

	return nil
}

func (uc *submissionWorkflowUsecase) UpdateAuditInfo(id uuid.UUID, userID uuid.UUID, userRole string, auditDate *time.Time) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	if userRole != "BUSINESS_DEVELOPMENT" && userRole != "ADMIN" && userRole != "DIRECTOR" {
		return errors.New("unauthorized to update audit info")
	}

	if err := uc.SubmissionRepo.UpdateAuditInfo(id, auditDate); err != nil {
		return err
	}

	uc.logChange(id, userID, "UPDATE_AUDIT_INFO", sub.Status, sub.Status, "Audit date set to "+auditDate.Format("2006-01-02"))

	// Notify Client
	_ = uc.NotifUC.SendWorkflowNotification("audit_scheduled_client", map[string]string{
		"client_name":   sub.Client.ClientName,
		"business_name": sub.Client.BusinessName,
		"date":          auditDate.Format("02 Jan 2006"),
	}, sub.Client.Phone, nil, id, "Jadwal Audit", "Halo *"+sub.Client.ClientName+"*, jadwal audit untuk *"+sub.Client.BusinessName+"* telah ditetapkan pada tanggal *"+auditDate.Format("02 Jan 2006")+"*. Mohon persiapkan dokumen dan tim Anda.")

	// Notify Drafter
	if sub.AssignedDrafterID != nil {
		drafter, _ := uc.UserRepo.FindByID(*sub.AssignedDrafterID)
		if drafter != nil {
			_ = uc.NotifUC.SendWorkflowNotification("audit_scheduled_internal", map[string]string{
				"business_name": sub.Client.BusinessName,
				"date":          auditDate.Format("02 Jan 2006"),
			}, drafter.Phone, &drafter.ID, id, "Jadwal Audit", "Halo *"+drafter.FullName+"*, jadwal audit untuk *"+sub.Client.BusinessName+"* telah ditetapkan pada tanggal *"+auditDate.Format("02 Jan 2006")+"*.")
		}
	}

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

func (uc *submissionWorkflowUsecase) UpdateBusinessType(id uuid.UUID, userID uuid.UUID, userRole string, businessTypeID int64) error {
	sub, err := uc.SubmissionRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Permission check (same as update client)
	canUpdate := (userRole == "ADMIN" || userRole == "DIRECTOR" || userRole == "DRAFTER" || userRole == "QC_OFFICER" || userRole == "HALAL_MANAGER" || userRole == "HALAL_DIRECTOR" || userRole == "HALAL_ADVISOR")
	if !canUpdate {
		return errors.New("unauthorized to update business type")
	}

	if err := uc.SubmissionRepo.UpdateBusinessType(id, businessTypeID); err != nil {
		return err
	}

	sub.BusinessTypeID = &businessTypeID
	_ = uc.RecalculateAndSaveRegularCost(sub, nil, nil, false)

	uc.logChange(id, userID, "UPDATE_BUSINESS_TYPE", sub.Status, sub.Status, "Business type updated")
	return nil
}

func (uc *submissionWorkflowUsecase) GetDrafterMonthlyAnalytics() ([]DrafterMonthlyStat, error) {
	subs, err := uc.SubmissionRepo.FindAll(map[string]interface{}{})
	if err != nil {
		return nil, err
	}

	statsMap := make(map[string]*DrafterMonthlyStat)

	for _, s := range subs {
		if s.AssignedDrafterID == nil {
			continue
		}
		monthStr := s.CreatedAt.Format("2006-01")
		key := monthStr + "_" + s.AssignedDrafterID.String()

		if _, exists := statsMap[key]; !exists {
			drafterName := "Unknown Drafter"
			if s.AssignedDrafter != nil && s.AssignedDrafter.FullName != "" {
				drafterName = s.AssignedDrafter.FullName
			} else {
				u, err := uc.UserRepo.FindByID(*s.AssignedDrafterID)
				if err == nil && u != nil {
					drafterName = u.FullName
				}
			}
			statsMap[key] = &DrafterMonthlyStat{
				Month:       monthStr,
				DrafterID:   s.AssignedDrafterID.String(),
				DrafterName: drafterName,
			}
		}

		stat := statsMap[key]
		if s.HasBeenReturned {
			stat.ReturnedSubmissionsCount++
		} else {
			stat.NewSubmissionsCount++
		}
		stat.TotalProcessed++
	}

	var result []DrafterMonthlyStat
	for _, stat := range statsMap {
		result = append(result, *stat)
	}
	return result, nil
}
