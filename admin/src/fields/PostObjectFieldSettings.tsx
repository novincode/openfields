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

interface PostObjectFieldSettingsProps {
  field: Field;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

interface PostType {
  value: string;
  label: string;
}

const getConfig = () => ({
  apiUrl: window.cofldAdmin?.restUrl || '/wp-json/openfields/v1',
  nonce: window.cofldAdmin?.nonce || '',
});

export function PostObjectFieldSettings({ field, onSettingsChange }: PostObjectFieldSettingsProps) {
  const settings = field.settings || {};
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available post types
  useEffect(() => {
    const fetchPostTypes = async () => {
      try {
        const config = getConfig();
        const response = await fetch(`${config.apiUrl}/options/post-types`, {
          headers: {
            'X-WP-Nonce': config.nonce,
          },
        });
        const data = await response.json();
        setPostTypes(data);
      } catch (error) {
        console.error('Failed to fetch post types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostTypes();
  }, []);

  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  // Handle post_type which could be string or string[]
  const postTypeValue = Array.isArray(settings.post_type) 
    ? settings.post_type[0] 
    : (settings.post_type as unknown as string) || 'post';

  return (
    <div className="space-y-4">
      {/* Post Type Selection */}
      <div className="space-y-2">
        <Label>{__('Post Type', 'codeideal-open-fields')}</Label>
        <Select
          value={postTypeValue}
          onValueChange={(value) => updateSetting('post_type', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? __('Loading...', 'codeideal-open-fields') : __('Select post type', 'codeideal-open-fields')} />
          </SelectTrigger>
          <SelectContent>
            {postTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {__('Select which post type to search from', 'codeideal-open-fields')}
        </p>
      </div>

      {/* Multiple Selection */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{__('Select Multiple', 'codeideal-open-fields')}</Label>
          <p className="text-xs text-muted-foreground">
            {__('Allow selecting multiple posts', 'codeideal-open-fields')}
          </p>
        </div>
        <Switch
          checked={settings.multiple as boolean || false}
          onCheckedChange={(checked) => updateSetting('multiple', checked)}
        />
      </div>

      {/* Return Format */}
      <div className="space-y-2">
        <Label>{__('Return Format', 'codeideal-open-fields')}</Label>
        <Select
          value={settings.return_format as string || 'object'}
          onValueChange={(value) => updateSetting('return_format', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={__('Select return format', 'codeideal-open-fields')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="object">{__('Post Object', 'codeideal-open-fields')}</SelectItem>
            <SelectItem value="id">{__('Post ID', 'codeideal-open-fields')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {__('Format of the value returned by get_field()', 'codeideal-open-fields')}
        </p>
      </div>

      {/* Allow Null */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{__('Allow Null', 'codeideal-open-fields')}</Label>
          <p className="text-xs text-muted-foreground">
            {__('Allow empty value', 'codeideal-open-fields')}
          </p>
        </div>
        <Switch
          checked={settings.allow_null as boolean || false}
          onCheckedChange={(checked) => updateSetting('allow_null', checked)}
        />
      </div>
    </div>
  );
}
