# 🚀 Authentik Forms - Remote Embedding Guide

This guide explains how to embed Authentik forms on external websites using the remote JavaScript widget.

## 📖 Overview

The Authentik Forms remote embedding feature allows you to display and collect form submissions on any website, regardless of the domain. The forms maintain their styling, validation, and functionality while being served from your Authentik server.

## 🌟 Features

- **🎨 Multiple Themes**: Choose from minimal, modern, and more themes
- **📱 Responsive Design**: Works perfectly on all devices
- **🔒 Secure**: All form data is processed securely by your Authentik server
- **⚡ Fast Loading**: Lightweight script with automatic CSS injection
- **🎯 Easy Integration**: Simple HTML attributes or JavaScript API
- **🔧 Customizable**: Multiple configuration options
- **🌐 Cross-domain**: Full CORS support for embedding anywhere
- **📊 Form Validation**: Built-in validation with error handling
- **🔄 Real-time Feedback**: Success and error messages

## 🚀 Quick Start

### Step 1: Include the Script

Add the Authentik Forms script to your HTML page:

```html
<script src="https://yourdomain.com/js/authentik-forms.js"></script>
```

### Step 2: Create a Container

Add a container element where you want the form to appear:

```html
<div id="my-form"></div>
```

### Step 3: Embed the Form

Choose one of the two methods below:

## 📝 Method 1: HTML Data Attributes (Automatic)

The simplest way to embed a form. Just add data attributes and the form loads automatically:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your content -->
    
    <!-- Form container with data attributes -->
    <div id="contact-form" 
         data-authentik-form="your-form-id-here"
         data-authentik-theme="minimal"
         data-authentik-show-title="true"
         data-authentik-show-description="true">
    </div>
    
    <!-- Include the script -->
    <script src="https://yourdomain.com/js/authentik-forms.js"></script>
</body>
</html>
```

### Available Data Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-authentik-form` | ✅ Yes | - | Your form ID from Authentik |
| `data-authentik-theme` | ❌ No | `minimal` | Theme: `minimal` or `modern` |
| `data-authentik-show-title` | ❌ No | `true` | Show form title |
| `data-authentik-show-description` | ❌ No | `true` | Show form description |

## ⚡ Method 2: JavaScript API (Programmatic)

For more control, use the JavaScript API:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your content -->
    
    <!-- Form container -->
    <div id="contact-form"></div>
    
    <!-- Include the script -->
    <script src="https://yourdomain.com/js/authentik-forms.js"></script>
    
    <script>
        // Optional: Configure base URL
        AuthentikForms.configure({
            baseUrl: 'https://yourdomain.com'
        });
        
        // Embed the form
        const form = AuthentikForms.embed('contact-form', 'your-form-id-here', {
            theme: 'modern',
            showTitle: true,
            showDescription: true,
            onSuccess: function(response) {
                console.log('Form submitted successfully!', response);
                alert('Thank you for your submission!');
            },
            onError: function(error) {
                console.error('Form submission failed:', error);
                alert('There was an error submitting the form.');
            }
        });
    </script>
</body>
</html>
```

### JavaScript API Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | string | `'minimal'` | Theme: `'minimal'` or `'modern'` |
| `showTitle` | boolean | `true` | Show form title |
| `showDescription` | boolean | `true` | Show form description |
| `onSuccess` | function | `null` | Callback when form is submitted successfully |
| `onError` | function | `null` | Callback when form submission fails |

## 🎨 Available Themes

### Minimal Theme
- Clean and simple design
- Modern spacing and subtle shadows
- Gray color scheme
- Perfect for professional websites

### Modern Theme
- Bold gradients and glass morphism
- Purple and blue color scheme
- Modern typography
- Eye-catching design for marketing pages

## ⚙️ Configuration

### Global Configuration

Configure the base URL for your Authentik server:

```javascript
AuthentikForms.configure({
    baseUrl: 'https://your-authentik-server.com'
});
```

### Form-specific Configuration

Each embedded form can have its own configuration:

```javascript
AuthentikForms.embed('container-id', 'form-id', {
    theme: 'modern',
    showTitle: false,
    showDescription: true,
    onSuccess: function(response) {
        // Redirect to thank you page
        window.location.href = '/thank-you';
    },
    onError: function(error) {
        // Custom error handling
        console.error('Submission failed:', error);
    }
});
```

## 🔧 Server Setup

### 1. Enable Form Embedding

In your Authentik dashboard:
1. Go to your form settings
2. Enable "Allow Embedding" option
3. Save the form

### 2. CORS Configuration

The server automatically handles CORS for public form endpoints. No additional configuration needed.

### 3. Security Considerations

- Forms marked as "not embeddable" cannot be loaded via the widget
- All form submissions include IP address and user agent for tracking
- Form data is validated on both client and server side

## 🛠️ Advanced Usage

### Multiple Forms on One Page

You can embed multiple forms on the same page:

```html
<!-- Form 1 -->
<div id="contact-form" 
     data-authentik-form="contact-form-id"
     data-authentik-theme="minimal">
</div>

<!-- Form 2 -->
<div id="newsletter-form" 
     data-authentik-form="newsletter-form-id"
     data-authentik-theme="modern">
</div>

<script src="https://yourdomain.com/js/authentik-forms.js"></script>
```

### Custom Styling

The widget automatically includes Tailwind CSS. You can override styles:

```css
/* Custom styles for your embedded forms */
.authentik-form-container {
    border-radius: 20px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
}
```

### Event Handling

Handle form events programmatically:

```javascript
const form = AuthentikForms.embed('my-form', 'form-id', {
    onSuccess: function(response) {
        // Track conversion
        gtag('event', 'form_submission', {
            'form_id': 'form-id',
            'submission_id': response.responseId
        });
        
        // Show custom success message
        document.getElementById('success-message').style.display = 'block';
    },
    onError: function(error) {
        // Track error
        console.error('Form error:', error);
        
        // Show custom error message
        document.getElementById('error-message').style.display = 'block';
    }
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Form not loading**
   - Check that the form ID is correct
   - Ensure the form is marked as "embeddable" in Authentik
   - Verify the script URL is accessible

2. **Styling issues**
   - The widget automatically includes Tailwind CSS
   - Check for CSS conflicts with your existing styles
   - Use browser dev tools to inspect styling issues

3. **CORS errors**
   - Ensure you're using the correct server URL
   - Check that the public endpoints are accessible

4. **Form not submitting**
   - Check browser console for JavaScript errors
   - Verify form validation requirements are met
   - Ensure the form is active in Authentik

### Debug Mode

Enable debug logging:

```javascript
// Add this before including the script
window.AUTHENTIK_DEBUG = true;
```

### Testing

Test the embedding on your local development:

1. Start your Authentik server
2. Visit `http://localhost:3000/embed-example` for a working demo
3. Copy the form ID from your Authentik dashboard
4. Replace the demo form ID in your HTML

## 📚 API Reference

### AuthentikForms.configure(config)

Configure global settings.

**Parameters:**
- `config.baseUrl` (string): Base URL of your Authentik server

### AuthentikForms.embed(containerId, formId, options)

Embed a form in the specified container.

**Parameters:**
- `containerId` (string): ID of the container element
- `formId` (string): Form ID from Authentik
- `options` (object): Configuration options

**Returns:** Form instance object

## 🔗 Related Documentation

- [Form Builder Guide](./FORM_BUILDER.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 💡 Examples

Check out the live example at `/embed-example` on your Authentik server for a complete demonstration of all features.

## 🆘 Support

If you need help with form embedding:

1. Check the troubleshooting section above
2. Visit the example page for working code
3. Review the browser console for error messages
4. Contact support with specific error details

---

**Happy embedding! 🎉**
