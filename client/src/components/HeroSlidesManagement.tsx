import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video,
  Play,
  Eye,
  Upload,
} from "lucide-react";
import type { HeroSlide } from "@shared/schema";

function SortableSlide({
  slide,
  onEdit,
  onDelete,
}: {
  slide: HeroSlide;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mediaType = (slide as any).mediaType || 'image';
  const mediaUrl = (slide as any).mediaUrl || slide.image;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors"
    >
      <button {...attributes} {...listeners} className="cursor-grab hover:text-orange-400">
        <GripVertical size={20} />
      </button>
      
      <div className="w-32 h-20 rounded overflow-hidden bg-gray-700 flex-shrink-0">
        {mediaType === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
            <Play size={24} className="text-white/70" />
            <span className="absolute bottom-1 right-1 text-xs bg-black/50 px-1 rounded">VIDEO</span>
          </div>
        ) : (
          <img
            src={mediaUrl || '/placeholder-product.png'}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate">{slide.title}</h3>
        {slide.subtitle && (
          <p className="text-sm text-gray-400 truncate">{slide.subtitle}</p>
        )}
        <div className="flex gap-2 mt-1">
          {mediaType === 'video' ? (
            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Video size={10} /> Video
            </span>
          ) : (
            <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
              <ImageIcon size={10} /> Image
            </span>
          )}
          {slide.buttonText && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              CTA: {slide.buttonText}
            </span>
          )}
        </div>
      </div>

      <span className={`text-xs px-2 py-1 rounded ${slide.enabled ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
        {slide.enabled ? 'Active' : 'Inactive'}
      </span>

      <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2">
        <Edit2 size={14} />
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 px-2 text-red-400 hover:text-red-300">
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

export function HeroSlidesManagement() {
  const { toast } = useToast();
  
  const [slideDialog, setSlideDialog] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideMediaType, setSlideMediaType] = useState<'image' | 'video'>('image');
  const [slideMediaUrl, setSlideMediaUrl] = useState("");
  const pendingObjectPathRef = useRef<string | null>(null);
  const [slideButtonText, setSlideButtonText] = useState("");
  const [slideButtonLink, setSlideButtonLink] = useState("");
  const [slideEnabled, setSlideEnabled] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteSlide, setDeleteSlide] = useState<HeroSlide | null>(null);
  
  const [previewDialog, setPreviewDialog] = useState(false);

  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ['/api/hero-slides'],
  });

  const sortedSlides = [...slides].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createSlideMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/hero-slides', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hero-slides'] });
      toast({ title: "Hero slide created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating slide", description: error.message, variant: "destructive" });
    }
  });

  const updateSlideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/admin/hero-slides/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hero-slides'] });
      toast({ title: "Hero slide updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating slide", description: error.message, variant: "destructive" });
    }
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/hero-slides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hero-slides'] });
      toast({ title: "Hero slide deleted successfully" });
      setDeleteDialog(false);
      setDeleteSlide(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting slide", description: error.message, variant: "destructive" });
    }
  });

  const reorderSlidesMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      return apiRequest('POST', '/api/admin/hero-slides/reorder', { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hero-slides'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error reordering slides", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setSlideDialog(false);
    setEditingSlide(null);
    setSlideTitle("");
    setSlideSubtitle("");
    setSlideMediaType('image');
    setSlideMediaUrl("");
    setSlideButtonText("");
    setSlideButtonLink("");
    setSlideEnabled(true);
  };

  const openEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle || "");
    setSlideMediaType(((slide as any).mediaType as 'image' | 'video') || 'image');
    setSlideMediaUrl((slide as any).mediaUrl || slide.image || "");
    setSlideButtonText(slide.buttonText || "");
    setSlideButtonLink(slide.buttonLink || "");
    setSlideEnabled(slide.enabled ?? true);
    setSlideDialog(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedSlides.findIndex((s) => s.id === active.id);
      const newIndex = sortedSlides.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sortedSlides, oldIndex, newIndex);
      reorderSlidesMutation.mutate(newOrder.map((s) => s.id));
    }
  };

  const handleSaveSlide = () => {
    if (!slideTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!slideMediaUrl.trim()) {
      toast({ title: "Media URL is required", variant: "destructive" });
      return;
    }

    const data = {
      title: slideTitle,
      subtitle: slideSubtitle || null,
      mediaType: slideMediaType,
      mediaUrl: slideMediaUrl,
      image: slideMediaType === 'image' ? slideMediaUrl : null,
      buttonText: slideButtonText || null,
      buttonLink: slideButtonLink || null,
      enabled: slideEnabled,
    };

    if (editingSlide) {
      updateSlideMutation.mutate({ id: editingSlide.id, data });
    } else {
      createSlideMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Hero Slides</h2>
          <p className="text-gray-400 text-sm">Manage the hero carousel on the customer homepage. Supports images and videos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewDialog(true)} className="border-gray-600">
            <Eye size={16} className="mr-2" /> Preview
          </Button>
          <Button onClick={() => setSlideDialog(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus size={16} className="mr-2" /> Add Slide
          </Button>
        </div>
      </div>

      {sortedSlides.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <ImageIcon size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No hero slides yet</h3>
          <p className="text-gray-500 mb-4">Create slides to showcase featured content on your homepage</p>
          <Button onClick={() => setSlideDialog(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus size={16} className="mr-2" /> Create First Slide
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedSlides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedSlides.map((slide) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  onEdit={() => openEditSlide(slide)}
                  onDelete={() => {
                    setDeleteSlide(slide);
                    setDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Slide Edit/Create Dialog */}
      <Dialog open={slideDialog} onOpenChange={(open) => { if (!open) resetForm(); else setSlideDialog(true); }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSlide ? 'Edit Hero Slide' : 'Create Hero Slide'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingSlide ? 'Update slide details' : 'Add a new slide to the hero carousel'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                placeholder="e.g., Welcome to Vape Cave"
                className="mt-2 bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label>Subtitle (Optional)</Label>
              <Textarea
                value={slideSubtitle}
                onChange={(e) => setSlideSubtitle(e.target.value)}
                placeholder="e.g., Premium vaping products delivered to your door"
                className="mt-2 bg-gray-700 border-gray-600"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Media Type</Label>
                <Select value={slideMediaType} onValueChange={(v: 'image' | 'video') => setSlideMediaType(v)}>
                  <SelectTrigger className="mt-2 bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="image">
                      <span className="flex items-center gap-2">
                        <ImageIcon size={14} /> Image
                      </span>
                    </SelectItem>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <Video size={14} /> Video
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={slideEnabled} onCheckedChange={setSlideEnabled} />
                <Label>Active</Label>
              </div>
            </div>
            <div>
              <Label>Media</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={slideMediaUrl}
                  onChange={(e) => setSlideMediaUrl(e.target.value)}
                  placeholder={slideMediaType === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
                  className="flex-1 bg-gray-700 border-gray-600"
                />
                <ObjectUploader
                  maxFileSize={slideMediaType === 'video' ? 104857600 : 10485760}
                  onGetUploadParameters={async (file) => {
                    try {
                      const response = await apiRequest('POST', '/api/storage/presign', {
                        fileName: file.name,
                        contentType: file.type,
                        directory: 'hero',
                      });
                      const data = await response.json();
                      // Store the objectPath in ref for later use in onComplete
                      pendingObjectPathRef.current = data.objectPath;
                      console.log("Got presigned URL for:", file.name, "objectPath:", data.objectPath);
                      return {
                        method: 'PUT' as const,
                        url: data.uploadUrl,
                        headers: { 'Content-Type': file.type || 'application/octet-stream' },
                      };
                    } catch (error) {
                      console.error("Failed to get presigned URL:", error);
                      toast({
                        title: "Upload failed",
                        description: "Could not get upload URL. Please try again.",
                        variant: "destructive",
                      });
                      throw error;
                    }
                  }}
                  onComplete={async (result) => {
                    if (result.successful?.length) {
                      // Use the objectPath stored in ref
                      const objectPath = pendingObjectPathRef.current;
                      if (objectPath) {
                        // Set public ACL for the uploaded file
                        try {
                          await apiRequest('POST', '/api/storage/set-public', { objectPath });
                        } catch (err) {
                          console.warn("Could not set public ACL:", err);
                        }
                        setSlideMediaUrl(objectPath);
                        pendingObjectPathRef.current = null;
                        toast({ title: "File uploaded successfully" });
                      }
                    }
                  }}
                  buttonClassName="bg-gray-700 hover:bg-gray-600 border-gray-600"
                >
                  <Upload size={16} className="mr-2" />
                  Upload
                </ObjectUploader>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {slideMediaType === 'video' ? 'Upload MP4 video (max 100MB) or paste URL' : 'Upload image or paste URL'}
              </p>
              {slideMediaUrl && slideMediaType === 'image' && (
                <div className="mt-2 h-32 rounded overflow-hidden border border-gray-600">
                  <img src={slideMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {slideMediaUrl && slideMediaType === 'video' && (
                <div className="mt-2 h-32 rounded overflow-hidden border border-gray-600">
                  <video src={slideMediaUrl} className="w-full h-full object-cover" muted controls />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text (Optional)</Label>
                <Input
                  value={slideButtonText}
                  onChange={(e) => setSlideButtonText(e.target.value)}
                  placeholder="e.g., Shop Now"
                  className="mt-2 bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <Label>Button Link (Optional)</Label>
                <Input
                  value={slideButtonLink}
                  onChange={(e) => setSlideButtonLink(e.target.value)}
                  placeholder="e.g., /delivery/shop"
                  className="mt-2 bg-gray-700 border-gray-600"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetForm} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={handleSaveSlide}
              disabled={createSlideMutation.isPending || updateSlideMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(createSlideMutation.isPending || updateSlideMutation.isPending) ? 'Saving...' : 'Save Slide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Hero Slide</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{deleteSlide?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setDeleteDialog(false); setDeleteSlide(null); }} className="border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => deleteSlide && deleteSlideMutation.mutate(deleteSlide.id)}
              disabled={deleteSlideMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSlideMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-[400px] bg-gray-800">
            {sortedSlides.filter(s => s.enabled).length > 0 ? (
              (() => {
                const slide = sortedSlides.filter(s => s.enabled)[0];
                const mediaType = (slide as any).mediaType || 'image';
                const mediaUrl = (slide as any).mediaUrl || slide.image;
                return (
                  <div className="relative w-full h-full">
                    {mediaType === 'video' ? (
                      <video
                        src={mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                      />
                    ) : (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${mediaUrl})` }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    <div className="relative h-full container mx-auto px-8 flex items-center">
                      <div className="max-w-xl text-white">
                        <h1 className="text-4xl font-bold mb-4">{slide.title}</h1>
                        {slide.subtitle && (
                          <p className="text-xl mb-6 text-white/80">{slide.subtitle}</p>
                        )}
                        {slide.buttonText && (
                          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                            {slide.buttonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No active slides to preview
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <p className="text-sm text-gray-400 text-center">
              Preview of the first active slide. The carousel will rotate through all active slides.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
