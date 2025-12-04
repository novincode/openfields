import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Field } from "@/types";

interface LinkFieldSettingsProps {
  field: Field;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

export function LinkFieldSettings({ field, onSettingsChange }: LinkFieldSettingsProps) {
  const settings = field.settings || {};

  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Show Link Text */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Show Link Text</Label>
          <p className="text-xs text-muted-foreground">
            Allow entering custom link text
          </p>
        </div>
        <Switch
          checked={settings.show_title !== false}
          onCheckedChange={(checked) => updateSetting('show_title', checked)}
        />
      </div>

      {/* Show Target */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Show Target Option</Label>
          <p className="text-xs text-muted-foreground">
            Allow selecting "Open in new tab"
          </p>
        </div>
        <Switch
          checked={settings.show_target !== false}
          onCheckedChange={(checked) => updateSetting('show_target', checked)}
        />
      </div>
    </div>
  );
}
