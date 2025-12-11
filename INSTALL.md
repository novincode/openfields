# 📥 Installing OpenFields - User Guide

**For WordPress users who want to use OpenFields**

---

## The Easiest Way (Recommended)

### 1. Download
Go to [OpenFields Releases](https://github.com/novincode/openfields/releases)

Find the latest release and download `openfields-X.X.X.zip`

### 2. Upload to WordPress
1. Go to **WordPress Admin**
2. Click **Plugins** in the left menu
3. Click **Add New**
4. Click **Upload Plugin**
5. Select the `openfields-X.X.X.zip` file
6. Click **Install Now**

### 3. Activate
Click the **Activate Plugin** button

### 4. Start Using
Go to **Tools → OpenFields** in the WordPress admin to create your first fieldset!

---

## Requirements

Your WordPress installation needs:

- **WordPress**: Version 6.0 or higher
- **PHP**: Version 7.4 or higher
- **Disk space**: ~5 MB for the plugin

Check your versions:
- WordPress version: **WordPress Admin → Dashboard** (shown at bottom)
- PHP version: **WordPress Admin → Tools → Site Health**

---

## What You Can Do

Once installed, you can:

✨ Create custom fields without coding  
📋 Create field groups and organize them  
🎯 Use conditional logic to show/hide fields  
📍 Display fields on posts, pages, users, or categories  
📤 Export and import your field configurations  
🔌 Access fields in your theme using simple functions

---

## Usage Example

### Create a Fieldset

1. Go to **Tools → OpenFields → Create New Fieldset**
2. Name it (e.g., "Product Details")
3. Add fields (Price, Description, etc.)
4. Set location (Show on Product posts)
5. Click Save

### Use Fields in Your Theme

In your theme file (like `single.php`):

```php
<?php
// Get a single field
$price = get_field('price');
echo 'Price: $' . $price;

// Or use it in a loop
if (have_rows('features')) {
    while (have_rows('features')) {
        the_row();
        echo get_sub_field('feature_name');
    }
}
?>
```

---

## Comparison to ACF

If you're familiar with Advanced Custom Fields (ACF):

| Feature | OpenFields | ACF |
|---------|-----------|-----|
| **Cost** | 100% Free | Free + Premium |
| **Code License** | Open Source (GPL) | Proprietary |
| **Basic API** | `get_field()` | `get_field()` |
| **Can Modify** | Yes, it's open source | No, proprietary |
| **Support** | Community | Paid support available |

**The API is designed to be familiar to ACF users!**

---

## Troubleshooting

### Plugin Won't Activate?
- Check WordPress version (needs 6.0+)
- Check PHP version (needs 7.4+)
- Check browser console for JavaScript errors
- Try reactivating the plugin

### Fields Don't Appear?
- Check that fieldset is assigned to correct post type
- Check location rules match your content
- Refresh the page
- Check browser console for errors

### Getting Errors?
- Check **WordPress Admin → Tools → Site Health** for issues
- Disable other plugins temporarily to test
- Check **WordPress Admin → Tools → OpenFields** for error messages

---

## Getting Help

- 📖 **Documentation**: [openfields.codeideal.com/docs](https://openfields.codeideal.com/docs)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/novincode/openfields/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/novincode/openfields/discussions)

---

## Next Steps

1. **Install OpenFields** (follow steps above)
2. **Create your first fieldset** in Tools → OpenFields
3. **Read the documentation** if you need help
4. **Consider supporting the project** if you find it useful

---

## Why Choose OpenFields?

✅ **100% Free** - No premium tiers, ever  
✅ **Open Source** - Modify it however you want  
✅ **No Vendor Lock-in** - Your data is yours  
✅ **Active Development** - Regularly updated  
✅ **Community Driven** - Built by developers, for developers  
✅ **WordPress Standard** - Follows all best practices  

---

**Happy building!** 🚀

Made with ❤️ by the OpenFields team
