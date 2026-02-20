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
        <Label>Post Type</Label>
        <Select
          value={postTypeValue}
          onValueChange={(value) => updateSetting('post_type', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : "Select post type"} />
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
          Select which post type to search from
        </p>
      </div>

      {/* Multiple Selection */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Select Multiple</Label>
          <p className="text-xs text-muted-foreground">
            Allow selecting multiple posts
          </p>
        </div>
        <Switch
          checked={settings.multiple as boolean || false}
          onCheckedChange={(checked) => updateSetting('multiple', checked)}
        />
      </div>

      {/* Return Format */}
      <div className="space-y-2">
        <Label>Return Format</Label>
        <Select
          value={settings.return_format as string || 'object'}
          onValueChange={(value) => updateSetting('return_format', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select return format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="object">Post Object</SelectItem>
            <SelectItem value="id">Post ID</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Format of the value returned by get_field()
        </p>
      </div>

      {/* Allow Null */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Allow Null</Label>
          <p className="text-xs text-muted-foreground">
            Allow empty value
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
