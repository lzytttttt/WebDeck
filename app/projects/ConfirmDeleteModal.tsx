"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/app/api/projects/route";

export function ConfirmDeleteModal({
  project,
  onCancel,
  onConfirm,
}: {
  project: ProjectSummary | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      open={Boolean(project)}
      onClose={onCancel}
      title={t.dashboard.confirmDeleteTitle}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            {t.common.delete}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {project ? t.dashboard.confirmDeleteBody(project.name) : ""}
      </p>
    </Modal>
  );
}
