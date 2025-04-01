"use client";

import Header from '@/components/shared/header';
import { useEffect, useState } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import {
  agregarMensaje,
  obtenerMensajes,
  editarMensaje,
  eliminarMensaje,
} from "@/actions/api-action";

import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Skeleton } from './ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface FormSystemMessageProps {
  userId: string;
};

interface Message {
  id: string;
  title?: string;
  message: string;
};

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-md" />
      ))}
    </div>
  );
};

export default function FormSystemMessage({ userId }: FormSystemMessageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const userMessages = await obtenerMensajes(userId);
      setMessages(userMessages);
    } catch (error) {
      toast.error("Error al cargar los mensajes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title.toUpperCase());
    formData.append("message", message);
    formData.append("userId", userId);

    try {
      let result;

      if (editingId) {
        formData.append("id", editingId);
        result = await editarMensaje(formData);
      } else {
        result = await agregarMensaje(formData);
      }

      if (result.success) {
        toast.success(result.message);
        setTitle("");
        setMessage("");
        setEditingId(null);
        setDialogOpen(false);
        loadMessages();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Hubo un error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (msg: Message) => {
    setTitle((msg.title)?.toUpperCase() ?? '');
    setMessage(msg.message ?? '');
    setEditingId(msg.id);
    setDialogOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);

    try {
      const result = await eliminarMensaje(deleteId);
      if (result.success) {
        toast.success(result.message);
        loadMessages();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al eliminar el mensaje");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const filteredMessages = messages.filter((msg) =>
    (msg.title?.toLowerCase() ?? "").includes(debouncedSearchTerm.toLowerCase())
  );

  const truncateMessage = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "… Ver más";
  };

  return (
    <div className='min-h-screen'>
      {/* Forzar toast por encima de Dialog */}
      {/* <div className="z-[9999] fixed top-0 right-0 w-full flex justify-end pointer-events-none" /> */}
      <div className="flex justify-between pb-6">
        <Header
          title={'Entrena tu IA'}
          subtitle={'Agrega y personaliza las instrucciones para tu IA.'}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="font-bold uppercase"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setMessage("");
              }}
            >
              Agregar
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Mensaje" : "Nuevo Mensaje"}</DialogTitle>
              <DialogDescription>
                Completa los campos para personalizar tu IA
              </DialogDescription>
            </DialogHeader>

            {/* Contenedor que crece */}
            <div className="flex flex-col gap-4 flex-1">
              {/* Campo Título */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  maxLength={100} // Limita el input a 50 caracteres
                  placeholder="Ejemplo: Bienvenida"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Campo Mensaje que ocupa el espacio restante */}
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="message">Descripción</Label>
                <Textarea
                  id="message"
                  placeholder="Ejemplo: Saluda cordialmente al usuario y ofrece ayuda."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 resize-none overflow-y-auto"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>

        </Dialog>
      </div>

      {/* Buscador */}
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Buscar mensaje por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div>
        {loading ? (
          <MessagesSkeleton />) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay mensajes configurados.</p>
          ) : (
          <div
            className="flex flex-col gap-3 overflow-y-auto"
          >
            {filteredMessages.map((msg) => (
              <Card key={msg.id} className="p-4 flex justify-between items-start">
                <div>
                  <h4 className="text-base font-medium">{(msg.title)?.toUpperCase()}</h4>
                  <p
                    className="text-sm text-muted-foreground cursor-pointer hover:underline"
                    onClick={() => openEditDialog(msg)}
                  >
                    {truncateMessage(msg.message, 100)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button className="bg-orange-500 text-white hover:bg-orange-600"
                    size="icon" onClick={() => openEditDialog(msg)}>
                    <PencilSquareIcon className="h-5 w-5" />
                  </Button>

                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => confirmDelete(msg.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>

                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. ¿Estás seguro de eliminar este mensaje?
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                          {loading ? "Eliminando..." : "Eliminar"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}