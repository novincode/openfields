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

interface UserFieldSettingsProps {
  field: Field;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

interface Role {
  value: string;
  label: string;
}

const getConfig = () => ({
  apiUrl: window.openfieldsAdmin?.restUrl || '/wp-json/openfields/v1',
  nonce: window.openfieldsAdmin?.nonce || '',
});

export function UserFieldSettings({ field, onSettingsChange }: UserFieldSettingsProps) {
  const settings = field.settings || {};
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const config = getConfig();
        const response = await fetch(`${config.apiUrl}/options/roles`, {
          headers: {
            'X-WP-Nonce': config.nonce,
          },
        });
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const updateSetting = (key: string, value: unknown) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Role Filter */}
      <div className="space-y-2">
        <Label>Filter by Role</Label>
        <Select
          value={String(settings.role || '')}
          onValueChange={(value) => updateSetting('role', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : "All Roles"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Filter users by role (leave empty for all)
        </p>
      </div>

      {/* Multiple Selection */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Select Multiple</Label>
          <p className="text-xs text-muted-foreground">
            Allow selecting multiple users
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
          value={String(settings.return_format || 'array')}
          onValueChange={(value) => updateSetting('return_format', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select return format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="array">User Array</SelectItem>
            <SelectItem value="object">User Object</SelectItem>
            <SelectItem value="id">User ID</SelectItem>
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
