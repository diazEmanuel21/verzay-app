import { TypePromptAi } from "@prisma/client";

export interface FormPromptAiProps {
    userId: string;
};

export interface PromptAi {
    id: string;
    title?: string;
    message: string;
    typePrompt: TypePromptAi
};

export interface InterfaceAiCreatePrompt {
  loading: boolean
  dialogOpen: boolean
  editingId: string | null
  title: string
  message: string
  type: TypePromptAi
  setDialogOpen: (open: boolean) => void
  setEditingId: (id: string | null) => void
  setTitle: (value: string) => void
  setMessage: (value: string) => void
  setType: (value: TypePromptAi) => void
  handleSubmit: () => void
};

export interface PromptTabsProps {
    messages: PromptAi[]
    debouncedSearchTerm?: string
    highlightMatch: (text: string, search: string) => React.ReactNode
    truncateMessage: (text: string, length: number) => string
    openEditDialog: (msg: PromptAi) => void
    confirmDelete: (id: string) => void
    loading?: boolean
};
