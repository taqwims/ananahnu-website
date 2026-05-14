import { useUserManagement } from '../../hooks/useUserManagement';
import { UserTableHeader } from '../../components/dashboard/users/UserTableHeader';
import { UserFilters } from '../../components/dashboard/users/UserFilters';
import { UserTable } from '../../components/dashboard/users/UserTable';
import { UserFormModal } from '../../components/dashboard/users/UserFormModal';
import { PasswordResultModal } from '../../components/dashboard/users/PasswordResultModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function UserManagement() {
    const {
        users, roles, total, loading, page, setPage, search, setSearch, roleFilter, setRoleFilter,
        coordinators, showModal, setShowModal, editingUser, saving, generatedPassword, setGeneratedPassword,
        formData, setFormData, confirmModal, setConfirmModal,
        openCreate, openEdit, handleSave, handleDelete, handleResetPassword
    } = useUserManagement();

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <UserTableHeader onAddClick={openCreate} />

            <UserFilters 
                search={search}
                setSearch={setSearch}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                roles={roles}
                onResetPage={() => setPage(1)}
            />

            <UserTable 
                users={users}
                loading={loading}
                onEdit={openEdit}
                onDelete={handleDelete}
                onResetPassword={handleResetPassword}
                page={page}
                total={total}
                setPage={setPage}
            />

            {generatedPassword ? (
                <PasswordResultModal 
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setGeneratedPassword(''); }}
                    password={generatedPassword}
                    isReset={!!editingUser}
                />
            ) : (
                <UserFormModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    editingUser={editingUser}
                    formData={formData}
                    setFormData={setFormData}
                    roles={roles}
                    coordinators={coordinators}
                    onSave={handleSave}
                    saving={saving}
                />
            )}

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}
