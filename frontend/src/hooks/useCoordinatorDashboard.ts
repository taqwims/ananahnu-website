import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User, TrainingParticipant, ConsultantProfile, Client, Submission } from '../types';

export type TabKey = 'team' | 'clients' | 'submissions';

export const useCoordinatorDashboard = () => {
    const currentUser = useAuthStore(state => state.user);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
    const [teamClients, setTeamClients] = useState<Client[]>([]);
    const [teamSubmissions, setTeamSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('team');

    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberTrainings, setMemberTrainings] = useState<TrainingParticipant[]>([]);
    const [memberClients, setMemberClients] = useState<Client[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const loadData = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const profilesRes = await api.get('/consultant/profiles');
            setProfiles(profilesRes.data || []);

            const users = (profilesRes.data || []).map((p: ConsultantProfile) => p.user).filter(Boolean);
            setTeamMembers(users);

            const [clientsRes, subsRes] = await Promise.all([
                api.get(`/clients/by-team/${currentUser.id}`).catch(() => ({ data: { data: [] } })),
                api.get('/submissions').catch(() => ({ data: [] }))
            ]);

            setTeamClients(clientsRes.data.data || []);
            setTeamSubmissions(subsRes.data || []);
        } catch (err) {
            console.error("Failed to load coordinator data", err);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const selectMember = async (member: User) => {
        setSelectedMember(member);
        setLoadingDetail(true);
        try {
            const [trainRes, clientRes] = await Promise.all([
                api.get(`/user-trainings/${member.id}`).catch(() => ({ data: [] })),
                api.get(`/clients?facilitator_id=${member.id}`).catch(() => ({ data: { data: [] } })),
            ]);
            setMemberTrainings(trainRes.data || []);
            setMemberClients(clientRes.data.data || clientRes.data || []);
        } catch {
            setMemberTrainings([]);
            setMemberClients([]);
        } finally {
            setLoadingDetail(false);
        }
    };

    const getMemberProfile = (userId: string) => profiles.find(p => p.user_id === userId);

    return {
        teamMembers, profiles, teamClients, teamSubmissions,
        loading, activeTab, setActiveTab,
        selectedMember, memberTrainings, memberClients, loadingDetail,
        selectMember, getMemberProfile, loadData
    };
};
