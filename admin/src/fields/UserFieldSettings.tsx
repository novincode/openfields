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

interface UserFieldSettingsProps {
  field: Field;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

interface Role {
  value: string;
  label: string;
}

const getConfig = () => ({
  apiUrl: window.cofldAdmin?.restUrl || '/wp-json/openfields/v1',
  nonce: window.cofldAdmin?.nonce || '',
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
      [key]: value === '__all__' ? '' : value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Role Filter */}
      <div className="space-y-2">
        <Label>{__('Filter by Role', 'codeideal-open-fields')}</Label>
        <Select
          value={String(settings.role || '__all__')}
          onValueChange={(value) => updateSetting('role', value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? __('Loading...', 'codeideal-open-fields') : __('All Roles', 'codeideal-open-fields')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{__('All Roles', 'codeideal-open-fields')}</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {__('Filter users by role (leave empty for all)', 'codeideal-open-fields')}
        </p>
      </div>

      {/* Multiple Selection */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{__('Select Multiple', 'codeideal-open-fields')}</Label>
          <p className="text-xs text-muted-foreground">
            {__('Allow selecting multiple users', 'codeideal-open-fields')}
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
          value={String(settings.return_format || 'array')}
          onValueChange={(value) => updateSetting('return_format', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={__('Select return format', 'codeideal-open-fields')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="array">{__('User Array', 'codeideal-open-fields')}</SelectItem>
            <SelectItem value="object">{__('User Object', 'codeideal-open-fields')}</SelectItem>
            <SelectItem value="id">{__('User ID', 'codeideal-open-fields')}</SelectItem>
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
