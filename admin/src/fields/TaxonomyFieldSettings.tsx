import { __ } from '@wordpress/i18n';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { Field } from "@/types";

interface TaxonomyFieldSettingsProps {
  field: Field;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

interface Taxonomy {
  value: string;
  label: string;
}

const getConfig = () => ({
  apiUrl: window.cofldAdmin?.restUrl || '/wp-json/openfields/v1',
  nonce: window.cofldAdmin?.nonce || '',
});

export function TaxonomyFieldSettings({ field, onSettingsChange }: TaxonomyFieldSettingsProps) {
  const settings = field.settings || {};
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available taxonomies
  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const config = getConfig();
        const response = await fetch(`${config.apiUrl}/options/taxonomies`, {
          headers: {
            'X-WP-Nonce': config.nonce,
          },
        });
        const data = await response.json();
        setTaxonomies(data);
      } catch (error) {
        console.error('Failed to fetch taxonomies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTaxonomies();
  }, []);

  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Taxonomy Selection */}
      <div className="space-y-2">
        <Label>{__('Taxonomy', 'codeideal-open-fields')}</Label>
        <Select
          value={String(settings.taxonomy || 'category')}
          onValueChange={(value) => updateSetting('taxonomy', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : "Select taxonomy"} />
          </SelectTrigger>
          <SelectContent>
            {taxonomies.map((tax) => (
              <SelectItem key={tax.value} value={tax.value}>
                {tax.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select which taxonomy to choose terms from
        </p>
      </div>

      {/* Appearance / Field Type */}
      <div className="space-y-2">
        <Label>{__('Appearance', 'codeideal-open-fields')}</Label>
        <Select
          value={(settings.field_type as string) || 'select'}
          onValueChange={(value) => updateSetting('field_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select appearance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="select">{__('Dropdown', 'codeideal-open-fields')}</SelectItem>
            <SelectItem value="checkbox">{__('Checkbox', 'codeideal-open-fields')}</SelectItem>
            <SelectItem value="radio">{__('Radio Buttons', 'codeideal-open-fields')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How the field should be displayed
        </p>
      </div>

      {/* Multiple Selection - only for select type */}
      {(settings.field_type === 'select' || !settings.field_type) && (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{__('Select Multiple', 'codeideal-open-fields')}</Label>
            <p className="text-xs text-muted-foreground">
              Allow selecting multiple terms
            </p>
          </div>
          <Switch
            checked={settings.multiple as boolean || false}
            onCheckedChange={(checked) => updateSetting('multiple', checked)}
          />
        </div>
      )}

      {/* Return Format */}
      <div className="space-y-2">
        <Label>{__('Return Format', 'codeideal-open-fields')}</Label>
        <Select
          value={(settings.return_format as string) || 'id'}
          onValueChange={(value) => updateSetting('return_format', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select return format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">{__('Term ID', 'codeideal-open-fields')}</SelectItem>
            <SelectItem value="object">{__('Term Object', 'codeideal-open-fields')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Format of the value returned by get_field()
        </p>
      </div>

      {/* Save Terms */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{__('Save Terms', 'codeideal-open-fields')}</Label>
          <p className="text-xs text-muted-foreground">
            Connect selected terms to the post
          </p>
        </div>
        <Switch
          checked={settings.save_terms as boolean || false}
          onCheckedChange={(checked) => updateSetting('save_terms', checked)}
        />
      </div>

      {/* Load Terms */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{__('Load Terms', 'codeideal-open-fields')}</Label>
          <p className="text-xs text-muted-foreground">
            Load value from the post's terms
          </p>
        </div>
        <Switch
          checked={settings.load_terms as boolean || false}
          onCheckedChange={(checked) => updateSetting('load_terms', checked)}
        />
      </div>
    </div>
  );
}
