'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Check,
  ChevronsUpDown,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  listToolConfigs,
  upsertToolConfig,
  deleteToolConfig,
  toggleToolConfig,
} from '@/actions/external-data-tool-config-actions';
import type {
  ExternalDataToolConfig,
  ExternalDataToolConfigInput,
  ExternalDataToolType,
} from '@/types/external-client-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientOption {
  id: string;
  label: string;
  email: string;
}

interface Props {
  clients: ClientOption[];
}

const TOOL_TYPE_LABELS: Record<ExternalDataToolType, string> = {
  auto_inject: 'Inyección automática',
  search_by_field: 'Búsqueda por campo',
};

const TOOL_TYPE_DESCRIPTIONS: Record<ExternalDataToolType, string> = {
  auto_inject:
    'El agente recibe los datos del contacto automáticamente en su contexto al inicio de cada conversación.',
  search_by_field:
    'El agente puede buscar información de cualquier contacto dado un valor de campo (cédula, correo, etc.).',
};

const DEFAULT_AUTO_INJECT_TEMPLATE = `## PERFIL DEL CLIENTE (datos registrados en el sistema)
{data}
Usa estos datos para personalizar tus respuestas. No los repitas todos de golpe; solo menciona los relevantes según el contexto. No inventes ni modifiques ninguno de estos valores.`;

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = (): ExternalDataToolConfigInput => ({
  toolKey: '',
  displayName: '',
  toolDescription: '',
  toolType: 'search_by_field',
  searchField: '',
  promptTemplate: '',
  isEnabled: true,
  sortOrder: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────

export function ExternalDataToolConfigManagement({ clients }: Props) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [comboOpen, setComboOpen] = useState(false);
  const [configs, setConfigs] = useState<ExternalDataToolConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ExternalDataToolConfig | null>(null);
  const [form, setForm] = useState<ExternalDataToolConfigInput>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ExternalDataToolConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadConfigs = useCallback(async (userId: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await listToolConfigs(userId);
      setConfigs(data);
    } catch {
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadConfigs(selectedUserId);
    } else {
      setConfigs([]);
    }
  }, [selectedUserId, loadConfigs]);

  // ── Dialog helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditConfig(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (cfg: ExternalDataToolConfig) => {
    setEditConfig(cfg);
    setForm({
      toolKey: cfg.toolKey,
      displayName: cfg.displayName,
      toolDescription: cfg.toolDescription,
      toolType: cfg.toolType,
      searchField: cfg.searchField ?? '',
      promptTemplate: cfg.promptTemplate ?? '',
      isEnabled: cfg.isEnabled,
      sortOrder: cfg.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const result = await upsertToolConfig(selectedUserId, form);
      if (result.success) {
        toast.success(editConfig ? 'Herramienta actualizada' : 'Herramienta creada');
        setDialogOpen(false);
        loadConfigs(selectedUserId);
      } else {
        toast.error(result.error ?? 'Error al guardar');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle ────────────────────────────────────────────────────────────────────
  const handleToggle = async (cfg: ExternalDataToolConfig, isEnabled: boolean) => {
    // Optimistic update
    setConfigs((prev) =>
      prev.map((c) => (c.id === cfg.id ? { ...c, isEnabled } : c)),
    );
    const result = await toggleToolConfig(selectedUserId, cfg.toolKey, isEnabled);
    if (!result.success) {
      toast.error('Error al cambiar estado');
      setConfigs((prev) =>
        prev.map((c) => (c.id === cfg.id ? { ...c, isEnabled: !isEnabled } : c)),
      );
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget || !selectedUserId) return;
    setIsDeleting(true);
    try {
      const result = await deleteToolConfig(selectedUserId, deleteTarget.toolKey);
      if (result.success) {
        toast.success('Herramienta eliminada');
        setDeleteTarget(null);
        loadConfigs(selectedUserId);
      } else {
        toast.error(result.error ?? 'Error al eliminar');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedUserId);

  return (
    <div className="space-y-4">
      {/* ── Client selector ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Herramientas IA por cliente</CardTitle>
          </div>
          <CardDescription>
            Configura las herramientas dinámicas que el agente IA puede usar para consultar
            datos externos de cada cliente. Sin código adicional en el backend.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5" />
                Cliente
              </Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className={cn(
                      'w-full justify-between font-normal',
                      !selectedUserId && 'border-amber-500/50 text-muted-foreground',
                    )}
                  >
                    {selectedUserId
                      ? (() => {
                          const c = clients.find((c) => c.id === selectedUserId);
                          return c ? `${c.label} — ${c.email}` : 'Cliente seleccionado';
                        })()
                      : 'Busca y selecciona un cliente...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente por nombre o email..." />
                    <CommandList>
                      <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.label} ${c.email}`}
                            onSelect={() => {
                              setSelectedUserId(c.id === selectedUserId ? '' : c.id);
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedUserId === c.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <span className="font-medium">{c.label}</span>
                            <span className="ml-2 text-muted-foreground text-xs">{c.email}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedUserId && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => loadConfigs(selectedUserId)}
                  disabled={isLoading}
                  title="Recargar"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva herramienta
                </Button>
              </>
            )}
          </div>

          {selectedUserId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>userId:</span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                {selectedUserId}
              </code>
              {selectedClient && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {selectedClient.label}
                </Badge>
              )}
              {!isLoading && (
                <Badge variant="secondary" className="text-xs">
                  {configs.length} herramienta{configs.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Config list ── */}
      {!selectedUserId ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Bot className="h-12 w-12 opacity-15" />
          <p className="text-sm">Selecciona un cliente para ver sus herramientas IA.</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground border border-dashed rounded-lg">
          <Zap className="h-10 w-10 opacity-15" />
          <p className="text-sm">No hay herramientas configuradas para este cliente.</p>
          <Button variant="outline" onClick={openCreate} className="gap-2 mt-1">
            <Plus className="h-4 w-4" />
            Crear primera herramienta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((cfg) => (
            <Card key={cfg.id} className={cn(!cfg.isEnabled && 'opacity-60')}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0 rounded-md bg-primary/10 p-2">
                    {cfg.toolType === 'auto_inject' ? (
                      <Zap className="h-4 w-4 text-primary" />
                    ) : (
                      <Search className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{cfg.displayName}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {cfg.toolKey}
                      </Badge>
                      <Badge
                        variant={cfg.toolType === 'auto_inject' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {TOOL_TYPE_LABELS[cfg.toolType]}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {cfg.toolDescription}
                    </p>

                    {cfg.toolType === 'search_by_field' && cfg.searchField && (
                      <p className="text-xs mt-1">
                        <span className="text-muted-foreground">Campo: </span>
                        <code className="bg-muted px-1 rounded text-[10px]">{cfg.searchField}</code>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={cfg.isEnabled}
                      onCheckedChange={(v) => handleToggle(cfg, v)}
                      title={cfg.isEnabled ? 'Deshabilitar' : 'Habilitar'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(cfg)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(cfg)}
                      title="Eliminar"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!isSaving) setDialogOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editConfig ? 'Editar herramienta' : 'Nueva herramienta IA'}
            </DialogTitle>
            <DialogDescription>
              Define cómo el agente IA interactúa con los datos externos de este cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tool type */}
            <div className="space-y-1.5">
              <Label>Tipo de herramienta</Label>
              <Select
                value={form.toolType}
                onValueChange={(v) => {
                  const t = v as ExternalDataToolType;
                  setForm((f) => ({
                    ...f,
                    toolType: t,
                    promptTemplate:
                      t === 'auto_inject' && !f.promptTemplate
                        ? DEFAULT_AUTO_INJECT_TEMPLATE
                        : f.promptTemplate,
                  }));
                }}
                disabled={!!editConfig}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="search_by_field">
                    <div className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5" />
                      Búsqueda por campo
                    </div>
                  </SelectItem>
                  <SelectItem value="auto_inject">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5" />
                      Inyección automática
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TOOL_TYPE_DESCRIPTIONS[form.toolType]}
              </p>
            </div>

            {/* Tool key */}
            <div className="space-y-1.5">
              <Label>
                Clave única{' '}
                <span className="text-muted-foreground font-normal text-xs">(toolKey)</span>
              </Label>
              <Input
                placeholder="ej: buscar_por_cedula"
                value={form.toolKey}
                onChange={(e) => setForm((f) => ({ ...f, toolKey: e.target.value }))}
                disabled={!!editConfig}
              />
              <p className="text-xs text-muted-foreground">
                Solo letras, números y guiones bajos. Se normaliza automáticamente.
              </p>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <Label>Nombre visible</Label>
              <Input
                placeholder="ej: Buscar por cédula"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>

            {/* Description (for AI) */}
            <div className="space-y-1.5">
              <Label>
                Descripción para el agente IA{' '}
                <span className="text-muted-foreground font-normal text-xs">(tool description)</span>
              </Label>
              <Textarea
                placeholder="ej: Busca información de un cliente a partir de su número de cédula o RIF."
                rows={3}
                value={form.toolDescription}
                onChange={(e) => setForm((f) => ({ ...f, toolDescription: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                El agente usa esta descripción para saber cuándo y cómo invocar la herramienta.
              </p>
            </div>

            {/* Search field (only for search_by_field) */}
            {form.toolType === 'search_by_field' && (
              <div className="space-y-1.5">
                <Label>
                  Campo de búsqueda{' '}
                  <span className="text-muted-foreground font-normal text-xs">(searchField)</span>
                </Label>
                <Input
                  placeholder="ej: CEDULA-RIF"
                  value={form.searchField ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, searchField: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Debe coincidir exactamente con el nombre de la columna en tus datos externos.
                </p>
              </div>
            )}

            {/* Prompt template (for auto_inject) */}
            {form.toolType === 'auto_inject' && (
              <div className="space-y-1.5">
                <Label>
                  Plantilla de prompt{' '}
                  <span className="text-muted-foreground font-normal text-xs">(promptTemplate)</span>
                </Label>
                <Textarea
                  placeholder={DEFAULT_AUTO_INJECT_TEMPLATE}
                  rows={6}
                  value={form.promptTemplate ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, promptTemplate: e.target.value }))}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Usa <code className="bg-muted px-1 rounded">{'{data}'}</code> donde quieras
                  insertar los datos del cliente formateados.
                </p>
              </div>
            )}

            {/* Enabled */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isEnabled: v }))}
                id="isEnabled"
              />
              <Label htmlFor="isEnabled" className="cursor-pointer">
                Herramienta habilitada
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editConfig ? 'Guardar cambios' : 'Crear herramienta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar herramienta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{' '}
              <strong>&ldquo;{deleteTarget?.displayName}&rdquo;</strong>? Esta acción no se puede deshacer.
              El agente IA dejará de usar esta herramienta inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
