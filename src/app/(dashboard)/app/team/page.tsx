"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Trash2, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompany, useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type { CompanyRole } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Modal, ConfirmDialog } from "@/components/modal";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner } from "@/components/ui";

interface Member {
  id: string;
  userId?: string;
  role: CompanyRole;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

interface Invitation {
  id: string;
  email: string;
  role: CompanyRole;
}

const ROLE_TONE: Record<CompanyRole, "accent" | "positive" | "neutral"> = {
  OWNER: "accent",
  ADMIN: "positive",
  MEMBER: "neutral",
};

const ROLE_LABEL: Record<CompanyRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export default function TeamPage() {
  const companyId = useCompanyId();
  const { access } = useCompany();
  const { canManage } = usePermissions();
  const queryClient = useQueryClient();

  const myUserId = access?.user?.id;

  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  const membersQuery = useQuery({
    queryKey: ["members", companyId],
    queryFn: () => api.get<Member[]>(`/companies/${companyId}/members`),
  });

  const invitesQuery = useQuery({
    queryKey: ["invitations", companyId],
    queryFn: () => api.get<Invitation[]>(`/companies/${companyId}/invitations`),
    enabled: canManage,
  });

  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey: ["members", companyId] });
  const invalidateInvites = () =>
    queryClient.invalidateQueries({ queryKey: ["invitations", companyId] });

  const changeRole = useMutation({
    mutationFn: (vars: { userId: string; role: CompanyRole }) =>
      api.patch(`/companies/${companyId}/members/${vars.userId}`, { role: vars.role }),
    onSuccess: invalidateMembers,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.delete<void>(`/companies/${companyId}/members/${userId}`),
    onSuccess: () => {
      invalidateMembers();
      setRemoving(null);
    },
  });

  const cancelInvite = useMutation({
    mutationFn: (invId: string) =>
      api.delete<void>(`/companies/${companyId}/invitations/${invId}`),
    onSuccess: invalidateInvites,
  });

  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Who can manage this workspace, and what they are allowed to do."
        actions={
          canManage ? (
            <Button onClick={() => setInviting(true)}>
              <Plus className="size-4" />
              Invite
            </Button>
          ) : undefined
        }
      />

      {membersQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={<Users className="size-10" />} title="No members yet" />
      ) : (
        <Card className="divide-y divide-line p-0">
          {members.map((member) => {
            const memberUserId = member.userId ?? member.user.id;
            const isSelf = memberUserId === myUserId;
            const isOwner = member.role === "OWNER";
            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={member.user.name} url={member.user.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {member.user.name}
                      {isSelf && <span className="ml-2 text-xs text-muted">You</span>}
                    </p>
                    <p className="truncate text-sm text-muted">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canManage && !isOwner ? (
                    <Select
                      className="w-36 py-2"
                      value={member.role}
                      disabled={changeRole.isPending}
                      onChange={(e) =>
                        changeRole.mutate({
                          userId: memberUserId,
                          role: e.target.value as CompanyRole,
                        })
                      }
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </Select>
                  ) : (
                    <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABEL[member.role]}</Badge>
                  )}
                  {canManage && !isOwner && !isSelf && (
                    <button
                      type="button"
                      onClick={() => setRemoving(member)}
                      className="rounded-full p-2 text-muted transition hover:bg-ink/5 hover:text-negative"
                      aria-label="Remove member"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {canManage && invites.length > 0 && (
        <div className="mt-8">
          <h2 className="display mb-4 text-xl text-ink">Pending invitations</h2>
          <Card className="divide-y divide-line p-0">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-muted">
                    <Mail className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{inv.email}</p>
                    <p className="text-sm text-muted">{ROLE_LABEL[inv.role]} · invited</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={cancelInvite.isPending && cancelInvite.variables === inv.id}
                  onClick={() => cancelInvite.mutate(inv.id)}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {inviting && (
        <InviteModal
          companyId={companyId}
          onClose={() => setInviting(false)}
          onSent={() => {
            invalidateInvites();
            setInviting(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() =>
          removing && removeMember.mutate(removing.userId ?? removing.user.id)
        }
        loading={removeMember.isPending}
        confirmLabel="Remove"
        title="Remove member"
        description={`Remove ${removing?.user.name ?? "this person"} from the workspace? They will lose access immediately.`}
      />
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="size-10 shrink-0 rounded-full object-cover" />;
  }
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
      {initials || "?"}
    </span>
  );
}

function InviteModal({
  companyId,
  onClose,
  onSent,
}: {
  companyId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: () =>
      api.post(`/companies/${companyId}/invitations`, { email: email.trim(), role }),
    onSuccess: onSent,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not send the invitation."),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite a teammate"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={send.isPending}
            disabled={!email.trim()}
            onClick={() => {
              setError(null);
              send.mutate();
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
          />
        </Field>
        <Field label="Role" hint="Admins can manage cards, locations, and the team.">
          <Select value={role} onChange={(e) => setRole(e.target.value as CompanyRole)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}
