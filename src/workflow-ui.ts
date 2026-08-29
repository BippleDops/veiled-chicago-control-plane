import { App, Modal, Notice, Setting, TFile, TFolder } from "obsidian";

import {
  buildTargetBaseline,
  operationTargetPrecondition,
  validateProposal,
  validateReviewedProposal,
  type MutationProposal,
  type ReviewedMutationProposal,
  type ReviewedTargetBaseline
} from "./operating";

export type WorkflowField =
  | {
      id: string;
      label: string;
      description?: string;
      type: "text" | "textarea";
      required?: boolean;
      placeholder?: string;
      value?: string;
    }
  | {
      id: string;
      label: string;
      description?: string;
      type: "select";
      required?: boolean;
      value?: string;
      options: Readonly<Record<string, string>>;
    }
  | {
      id: string;
      label: string;
      description?: string;
      type: "toggle";
      required?: boolean;
      value?: boolean;
    };

export type WorkflowValues = Record<string, string | boolean>;

export class WorkflowFormModal extends Modal {
  private readonly values: WorkflowValues = {};
  private readonly controls = new Map<string, HTMLElement>();
  private submitting = false;
  private errorEl: HTMLElement | null = null;
  private errorId = "";
  private submitButton: HTMLButtonElement | null = null;

  constructor(
    app: App,
    private readonly heading: string,
    private readonly description: string,
    private readonly fields: readonly WorkflowField[],
    private readonly submitLabel: string,
    private readonly onSubmit: (values: WorkflowValues) => Promise<void> | void,
    private readonly onDismiss: () => void = () => undefined
  ) {
    super(app);
    for (const field of fields) this.values[field.id] = field.value ?? (field.type === "toggle" ? false : "");
  }

  onOpen(): void {
    this.modalEl.addClass("vc-control-workflow-modal");
    const titleId = `vcg-workflow-title-${crypto.randomUUID()}`;
    const descriptionId = `vcg-workflow-description-${crypto.randomUUID()}`;
    const errorId = `vcg-workflow-error-${crypto.randomUUID()}`;
    this.errorId = errorId;
    this.titleEl.id = titleId;
    this.titleEl.setText(this.heading);
    this.contentEl.createEl("p", { cls: "vc-control-workflow-intro", text: this.description, attr: { id: descriptionId } });
    this.modalEl.setAttr("aria-labelledby", titleId);
    this.modalEl.setAttr("aria-describedby", `${descriptionId} ${errorId}`);
    this.errorEl = this.contentEl.createEl("p", {
      cls: "vc-control-workflow-error",
      attr: { id: errorId, role: "alert", "aria-live": "assertive", hidden: "" }
    });

    for (const field of this.fields) {
      const setting = new Setting(this.contentEl).setName(`${field.label}${field.required ? " *" : ""}`);
      if (field.description) setting.setDesc(field.description);
      const fieldId = `vcg-field-${field.id}-${crypto.randomUUID()}`;
      const labelId = `${fieldId}-label`;
      setting.nameEl.id = labelId;
      const describeControl = (control: HTMLElement): void => {
        control.id = fieldId;
        this.controls.set(field.id, control);
        control.setAttr("aria-labelledby", labelId);
        if (field.required) control.setAttr("aria-required", "true");
        if (field.description) {
          const descriptionElement = setting.descEl;
          descriptionElement.id = `${fieldId}-description`;
          control.setAttr("aria-describedby", descriptionElement.id);
        }
      };
      if (field.type === "text") {
        setting.addText((component) => {
          describeControl(component.inputEl);
          component.setValue(String(this.values[field.id] ?? ""));
          if (field.placeholder) component.setPlaceholder(field.placeholder);
          component.onChange((value) => {
            this.updateValue(field, value);
          });
        });
      } else if (field.type === "textarea") {
        setting.addTextArea((component) => {
          describeControl(component.inputEl);
          component.setValue(String(this.values[field.id] ?? ""));
          if (field.placeholder) component.setPlaceholder(field.placeholder);
          component.onChange((value) => {
            this.updateValue(field, value);
          });
        });
      } else if (field.type === "select") {
        setting.addDropdown((component) => {
          describeControl(component.selectEl);
          component.addOptions({ ...field.options });
          component.setValue(String(this.values[field.id] ?? ""));
          component.onChange((value) => {
            this.updateValue(field, value);
          });
        });
      } else {
        setting.addToggle((component) => {
          describeControl(component.toggleEl);
          component.setValue(Boolean(this.values[field.id])).onChange((value) => {
            this.updateValue(field, value);
          });
        });
      }
    }

    const actions = this.contentEl.createDiv({ cls: "vc-control-confirm-actions" });
    const cancel = actions.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.submitButton = actions.createEl("button", { cls: "mod-cta", text: this.submitLabel });
    this.submitButton.type = "button";
    this.submitButton.addEventListener("click", () => void this.submit());
    window.setTimeout(() => this.modalEl.querySelector<HTMLInputElement>("input, textarea, select")?.focus(), 0);
  }

  onClose(): void {
    this.onDismiss();
    this.controls.clear();
    this.errorEl = null;
    this.errorId = "";
    this.submitButton = null;
    this.contentEl.empty();
  }

  private async submit(): Promise<void> {
    if (this.submitting) return;
    const missing = this.fields.filter((field) => this.isMissing(field));
    if (missing.length > 0) {
      const message = `Required: ${missing.map((field) => field.label).join(", ")}.`;
      for (const field of missing) this.markInvalid(field.id);
      this.showError(message);
      this.controls.get(missing[0]?.id ?? "")?.focus();
      new Notice(message);
      return;
    }
    this.submitting = true;
    if (this.submitButton) this.submitButton.disabled = true;
    try {
      await this.onSubmit({ ...this.values });
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showError(message);
      new Notice(`Control Plane: ${message}`, 10000);
    } finally {
      this.submitting = false;
      if (this.submitButton) this.submitButton.disabled = false;
    }
  }

  private showError(message: string): void {
    if (!this.errorEl) return;
    this.errorEl.removeAttribute("hidden");
    this.errorEl.setText(message);
  }

  private updateValue(field: WorkflowField, value: string | boolean): void {
    this.values[field.id] = value;
    if (!this.isMissing(field)) this.clearInvalid(field.id);
  }

  private isMissing(field: WorkflowField): boolean {
    if (!field.required) return false;
    const value = this.values[field.id];
    return typeof value === "boolean" ? !value : typeof value !== "string" || !value.trim();
  }

  private markInvalid(fieldId: string): void {
    const control = this.controls.get(fieldId);
    if (!control) return;
    control.setAttr("aria-invalid", "true");
    const descriptions = new Set((control.getAttr("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    descriptions.add(this.errorId);
    control.setAttr("aria-describedby", [...descriptions].join(" "));
  }

  private clearInvalid(fieldId: string): void {
    const control = this.controls.get(fieldId);
    if (!control || control.getAttr("aria-invalid") !== "true") return;
    control.removeAttribute("aria-invalid");
    const descriptions = (control.getAttr("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== this.errorId);
    if (descriptions.length > 0) control.setAttr("aria-describedby", descriptions.join(" "));
    else control.removeAttribute("aria-describedby");
    const remaining = this.fields.filter((field) => this.controls.get(field.id)?.getAttr("aria-invalid") === "true");
    if (remaining.length > 0) {
      this.showError(`Required: ${remaining.map((field) => field.label).join(", ")}.`);
      return;
    }
    this.errorEl?.setAttr("hidden", "");
    this.errorEl?.setText("");
  }
}

export class ProposalReviewModal extends Modal {
  private submitted = false;
  private closed = false;
  private previewSnapshot = "";
  private errorEl: HTMLElement | null = null;
  private readonly baselineElements = new Map<string, HTMLElement>();
  private readonly evidenceBaselineElements = new Map<string, HTMLElement>();

  constructor(
    app: App,
    private readonly proposal: MutationProposal,
    private readonly onExecute: (proposal: ReviewedMutationProposal) => Promise<void>,
    private readonly onDismiss: () => void = () => undefined
  ) {
    super(app);
  }

  onOpen(): void {
    this.closed = false;
    validateProposal(this.proposal);
    this.modalEl.addClass("vc-control-proposal-modal");
    const titleId = `vcg-proposal-title-${crypto.randomUUID()}`;
    const descriptionId = `vcg-proposal-description-${crypto.randomUUID()}`;
    const errorId = `vcg-proposal-error-${crypto.randomUUID()}`;
    this.titleEl.id = titleId;
    this.titleEl.setText(`Review: ${this.proposal.title}`);
    const policy = this.contentEl.createDiv({ cls: "vc-control-proposal-policy" });
    policy.id = descriptionId;
    this.modalEl.setAttr("aria-labelledby", titleId);
    this.modalEl.setAttr("aria-describedby", `${descriptionId} ${errorId}`);
    policy.createEl("strong", { text: "PROPOSE → HUMAN REVIEW → EXECUTE" });
    policy.createEl("p", { text: this.proposal.summary });
    policy.createEl("p", {
      text:
        this.proposal.canonImpact === "candidate-only"
          ? "This creates or appends candidates only. It does not promote canon."
          : "This operation does not change canonical owners."
    });
    this.errorEl = this.contentEl.createEl("p", {
      cls: "vc-control-workflow-error",
      attr: { id: errorId, role: "alert", "aria-live": "assertive", hidden: "" }
    });

    const evidenceSources = this.proposal.evidenceSources ?? [];
    if (evidenceSources.length > 0) {
      const evidence = this.contentEl.createEl("section", { cls: "vc-control-proposal-evidence" });
      evidence.createEl("h3", { text: "Evidence read set" });
      evidence.createEl("p", {
        text: "Each source must remain the same existing file from review through execution."
      });
      const evidenceList = evidence.createEl("ul");
      for (const source of evidenceSources) {
        const item = evidenceList.createEl("li");
        item.createEl("code", { text: source.path });
        const baseline = item.createEl("p", {
          text: `Expected SHA-256 ${source.contentHash.slice(0, 16)}…; capturing file baseline…`
        });
        this.evidenceBaselineElements.set(source.path, baseline);
      }
    }

    const list = this.contentEl.createEl("ol", { cls: "vc-control-proposal-list" });
    for (const operation of this.proposal.operations) {
      const item = list.createEl("li");
      const details = item.createEl("details");
      const summary = details.createEl("summary");
      summary.createEl("code", { text: operation.kind.toUpperCase() });
      summary.createSpan({ text: operation.path });
      const target = this.app.vault.getAbstractFileByPath(operation.path);
      const observed = target instanceof TFile ? "existing file" : target instanceof TFolder ? "folder (blocked)" : "missing";
      details.createEl("p", { text: `Precondition: ${operationTargetPrecondition(operation)}` });
      const baseline = details.createEl("p", { text: `Reviewed baseline: capturing ${observed}…` });
      this.baselineElements.set(operation.path, baseline);
      if (operation.kind === "append" && operation.initialContents !== undefined) {
        details.createEl("h4", { text: "Initializer used only if the target is missing" });
        details.createEl("pre", { text: operation.initialContents });
      }
      details.createEl("h4", { text: operation.kind === "create" ? "New file" : "Append" });
      details.createEl("pre", { text: operation.contents });
    }

    const actions = this.contentEl.createDiv({ cls: "vc-control-confirm-actions" });
    const cancel = actions.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const execute = actions.createEl("button", { cls: "mod-cta", text: "Execute reviewed proposal" });
    execute.type = "button";
    execute.disabled = true;
    execute.setAttr("aria-busy", "true");
    execute.setAttr("aria-describedby", errorId);
    execute.addEventListener("click", () => void this.execute(execute));
    window.setTimeout(() => cancel.focus(), 0);
    void this.captureBaselines(execute);
  }

  onClose(): void {
    this.closed = true;
    this.onDismiss();
    this.errorEl = null;
    this.baselineElements.clear();
    this.evidenceBaselineElements.clear();
    this.contentEl.empty();
  }

  private async execute(button: HTMLButtonElement): Promise<void> {
    if (this.submitted) return;
    this.submitted = true;
    button.disabled = true;
    try {
      if (!this.previewSnapshot) throw new Error("Reviewed target baselines are not ready.");
      const reviewed = JSON.parse(this.previewSnapshot) as ReviewedMutationProposal;
      validateReviewedProposal(reviewed);
      await this.onExecute(reviewed);
      this.close();
    } catch (error) {
      this.submitted = false;
      button.disabled = false;
      const message = error instanceof Error ? error.message : String(error);
      this.errorEl?.removeAttribute("hidden");
      this.errorEl?.setText(message);
      new Notice(`Control Plane transaction failed: ${message}`, 12000);
    }
  }

  private async captureBaselines(button: HTMLButtonElement): Promise<void> {
    try {
      const capture = async (path: string): Promise<ReviewedTargetBaseline> => {
        const target = this.app.vault.getAbstractFileByPath(path);
        if (target instanceof TFolder) return buildTargetBaseline(path, "folder", null, null, null);
        if (!(target instanceof TFile)) return buildTargetBaseline(path, "missing", null, null, null);
        const contents = await this.app.vault.read(target);
        return buildTargetBaseline(path, "file", contents, target.stat.mtime, target.stat.size);
      };
      const [targetBaselines, evidenceBaselines] = await Promise.all([
        Promise.all(this.proposal.operations.map((operation) => capture(operation.path))),
        Promise.all((this.proposal.evidenceSources ?? []).map((source) => capture(source.path)))
      ]);
      const reviewed: ReviewedMutationProposal = { ...this.proposal, targetBaselines, evidenceBaselines };
      validateReviewedProposal(reviewed);
      if (this.closed) return;
      for (const baseline of targetBaselines) {
        const element = this.baselineElements.get(baseline.path);
        if (!element) continue;
        const summary =
          baseline.kind === "file"
            ? `file · SHA-256 ${baseline.contentHash?.slice(0, 16)}… · ${baseline.size} bytes · mtime ${new Date(
                baseline.mtime ?? 0
              ).toISOString()}`
            : baseline.kind;
        element.setText(`Reviewed baseline: ${summary}.`);
      }
      for (const baseline of evidenceBaselines) {
        const element = this.evidenceBaselineElements.get(baseline.path);
        if (!element) continue;
        element.setText(
          `Reviewed evidence: file · SHA-256 ${baseline.contentHash?.slice(0, 16)}… · ${baseline.size} bytes · mtime ${new Date(
            baseline.mtime ?? 0
          ).toISOString()}.`
        );
      }
      this.previewSnapshot = JSON.stringify(reviewed);
      button.disabled = false;
      button.setAttr("aria-busy", "false");
    } catch (error) {
      if (this.closed) return;
      const message = error instanceof Error ? error.message : String(error);
      this.errorEl?.removeAttribute("hidden");
      this.errorEl?.setText(`Target or evidence baseline capture failed: ${message}`);
      button.disabled = true;
      button.setAttr("aria-busy", "false");
    }
  }
}
