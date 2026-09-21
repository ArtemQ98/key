import { useRef } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useUploadFleetAvatar,
  useRemoveFleetAvatar,
} from "@/hooks/useFleetProfile";
import { cn } from "@/lib/cn";

interface AvatarUploaderProps {
  currentUrl: string;
  title: string;
}

export function AvatarUploader({ currentUrl, title }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFleetAvatar();
  const remove = useRemoveFleetAvatar();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate(file);
  }

  function handleRemove() {
    if (confirm("Удалить аватарку автопарка?")) {
      remove.mutate();
    }
  }

  return (
    <div className="flex items-center gap-5">
      {/* Превью аватарки */}
      <div className="relative">
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary text-2xl font-bold",
            currentUrl && "border-0",
          )}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground">
              {title.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-brand transition-colors hover:bg-primary-dark disabled:opacity-50"
          aria-label="Загрузить аватарку"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Текст + кнопки */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">Аватарка автопарка</div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG или WebP · до 3 МБ
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={upload.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            {currentUrl ? "Заменить" : "Загрузить"}
          </Button>

          {currentUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              loading={remove.isPending}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}