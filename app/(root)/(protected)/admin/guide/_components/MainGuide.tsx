'use client';

import { useEffect, useState } from 'react';
import { GuidesUrl as Guide } from '@prisma/client';
import { getAllGuides, createGuide, updateGuide, deleteGuide } from '@/actions/guide-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { navLinks } from '@/constants/navLinks';

export const MainGuide = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<Partial<Guide>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');


    const fetchGuides = async () => {
        setLoading(true);
        const res = await getAllGuides();
        if (res.success) setGuides(res.data ?? []);
        else toast.error(res.message);
        setLoading(false);
    };

    useEffect(() => {
        fetchGuides();
    }, []);

    const handleSubmit = async () => {
        if (!form.title?.trim() || !form.url?.trim() || !form.path?.trim()) {
            return toast.error('All fields are required');
        }

        let res;
        if (editingId) {
            res = await updateGuide({ ...form, id: editingId } as any);
        } else {
            res = await createGuide(form as any);
        }

        if (res.success) {
            toast.success(editingId ? 'Guide updated' : 'Guide created');
            setOpen(false);
            setForm({});
            setEditingId(null);
            fetchGuides();
        } else {
            toast.error(res.message);
        }
    };

    const handleEdit = (guide: Guide) => {
        setForm(guide);
        setEditingId(guide.id);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        const res = await deleteGuide(id);
        if (res.success) {
            toast.success('Guide deleted');
            fetchGuides();
        } else {
            toast.error(res.message);
        }
    };


    const filteredGuides = guides.filter(guide =>
        guide.title.toLowerCase().includes(filter.toLowerCase()) ||
        guide.path.toLowerCase().includes(filter.toLowerCase())
        // guide.description.toLowerCase().includes(filter.toLowerCase())
    );


    return (
        <div className="flex flex-col p-4 gap-6 overflow-hidden">

            {/* Header y Filtro */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between overflow-hidden">
                <div className="flex flex-1 gap-2 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search guides..."
                            className="pl-8"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => {
                                    setForm({});         // Limpia campos
                                    setEditingId(null);  // Quita modo edición
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Guide
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="space-y-4">
                            <DialogTitle>{form.id ? 'Edit Guide' : 'Create Guide'}</DialogTitle>
                            <Input
                                placeholder="Enter the title of the guide (e.g., How to Create an Account)"
                                value={form.title || ''}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                            />
                            <Input
                                placeholder="Enter the URL (e.g., https://example.com/guide)"
                                value={form.url || ''}
                                onChange={e => setForm({ ...form, url: e.target.value })}
                            />
                            <Select
                                value={form.path || ''}
                                onValueChange={(value) => setForm({ ...form, path: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a module/section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {navLinks.map((link) => (
                                        <SelectItem key={link.route} value={link.route}>
                                            {link.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="Short description of the guide purpose or instructions..."
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                            <Button onClick={handleSubmit} className="w-full">
                                {form.id ? 'Update Guide' : 'Create Guide'}
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <p className="text-muted-foreground">Loading guides...</p>
                </div>
            ) : (
                <div className="flex-1">
                    <div className="max-h-[70vh] overflow-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-[400px]">
                            {filteredGuides.length > 0 ? (
                                filteredGuides.map(guide => (
                                    <Card key={guide.id} className="relative">
                                        <CardHeader>
                                            <CardTitle>{guide.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                                            <p className="text-xs text-muted-foreground mb-2">Module: {guide.path}</p>
                                            <a
                                                href={guide.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 text-sm underline"
                                            >
                                                View Guide
                                            </a>
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <Button size="icon" variant="outline" onClick={() => handleEdit(guide)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="destructive" onClick={() => handleDelete(guide.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="flex justify-center items-center py-10 col-span-full">
                                    <p className="text-muted-foreground">No guides found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}