import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { RentalTerm } from "@/api/types";

interface RentalTermsEditorProps {
  value: RentalTerm[];
  onChange: (terms: RentalTerm[]) => void;
}

export function RentalTermsEditor({ value, onChange }: RentalTermsEditorProps) {
  function addSection() {
    onChange([...value, { title: "", items: [""] }]);
  }

  function removeSection(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateTitle(index: number, title: string) {
    const next = [...value];
    next[index] = { ...next[index], title };
    onChange(next);
  }

  function addItem(sectionIndex: number) {
    const next = [...value];
    next[sectionIndex] = {
      ...next[sectionIndex],
      items: [...next[sectionIndex].items, ""],
    };
    onChange(next);
  }

  function removeItem(sectionIndex: number, itemIndex: number) {
    const next = [...value];
    next[sectionIndex] = {
      ...next[sectionIndex],
      items: next[sectionIndex].items.filter((_, i) => i !== itemIndex),
    };
    onChange(next);
  }

  function updateItem(sectionIndex: number, itemIndex: number, text: string) {
    const next = [...value];
    const items = [...next[sectionIndex].items];
    items[itemIndex] = text;
    next[sectionIndex] = { ...next[sectionIndex], items };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {value.map((section, si) => (
        <div
          key={si}
          className="rounded-xl border border-border bg-secondary/30 p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={section.title}
              onChange={(e) => updateTitle(si, e.target.value)}
              placeholder="Название секции (Аренда, Топливо…)"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSection(si)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {section.items.map((item, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">•</span>
                <Input
                  value={item}
                  onChange={(e) => updateItem(si, ii, e.target.value)}
                  placeholder="Пункт условия"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(si, ii)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItem(si)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Plus className="h-3 w-3" />
            Добавить пункт
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full"
      >
        <Plus className="h-4 w-4" />
        Добавить секцию
      </Button>
    </div>
  );
}