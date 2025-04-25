# Foundation Fill Architecture

Foundation Fill implements a modular architecture that combines Model-View patterns with service-oriented design. This
document explains the overall architecture and data flow of the extension.

## Architecture Diagram

```mermaid
graph TD
%% Extension Components
    User((User))
    Popup[Popup UI]
    Background[Background Script]
    ContentScript[Content Script]
    Browser[Browser]
    Storage[Chrome Storage]
    API[External API]
%% Models
    TemplateModel[Template Model]
    SettingsModel[Settings Model]
%% Views
    TemplateList[Template List View]
    TemplateEditor[Template Editor View]
    Settings[Settings View]
%% Services
    ThemeService[Theme Service]
    APIService[API Service]
    StorageService[Storage Service]
    MessageService[Message Service]
    TemplateService[Template Service]
%% Flow
    User -->|Opens Extension| Popup
   User -->|Right - clicks on text field| Browser
    Browser -->|Triggers Context Menu| Background
    Background -->|Fill Template| ContentScript
%% Models-Views-Controller
    Popup -->|Initializes| TemplateModel
    Popup -->|Initializes| SettingsModel
    Popup -->|Initializes| ThemeService
    Popup -->|Initializes| TemplateList
    Popup -->|Initializes| TemplateEditor
    Popup -->|Initializes| Settings
%% Data Flow
    TemplateModel <-->|Save/Load| StorageService
    SettingsModel <-->|Save/Load| StorageService
    StorageService <-->|CRUD Operations| Storage
%% Event Flow
    TemplateList -->|Template Selection| TemplateEditor
    TemplateEditor -->|Generate Text| Background
    Background -->|API Request| APIService
    APIService -->|External Request| API
    API -->|Response| APIService
    APIService -->|Generated Text| Background
    Background -->|Fill Text Area| ContentScript
    ContentScript -->|Fill Active Element| Browser
%% Settings Flow
    Settings -->|Theme Change| ThemeService
    Settings -->|Save Settings| SettingsModel
    ThemeService -->|Apply Theme| Popup
%% Storage Flow
    StorageService -->|Watch Changes| Background
    Background -->|Update Context Menu| Browser
%% Message Flow
    Popup <-->|Messages| Background
    Background <-->|Messages| ContentScript
%% Template Service
    TemplateService -->|Filter Templates| Background
%% Styles
   classDef component fill: #f9f, stroke: #333, stroke-width: 2px;
   classDef service fill: #bbf, stroke: #333, stroke-width: 1px;
   classDef model fill: #bfb, stroke: #333, stroke-width: 1px;
   classDef view fill: #ffb, stroke: #333, stroke-width: 1px;
   classDef external fill: #ddd, stroke: #333, stroke-width: 1px;
   classDef user fill: #fbb, stroke: #333, stroke-width: 2px;
    class User user;
   class Popup, Background, ContentScript, Browser component;
   class ThemeService, APIService, StorageService, MessageService, TemplateService service;
   class TemplateModel, SettingsModel model;
   class TemplateList, TemplateEditor, Settings view;
   class Storage, API external;
```

## Core Components

### Extension Components

1. **Background Script (`background.ts`)**
   - Acts as the central coordinator for the extension
   - Manages context menu creation and updates
   - Handles messages from the popup and content scripts
   - Coordinates API requests and responses

2. **Content Script (`content.ts`)**
   - Runs in the context of web pages
   - Interacts with the web page DOM
   - Fills text fields with template content
   - Manages text generation animation

3. **Popup UI (`index.ts`, `Popup.ts`)**
   - User interface for managing templates and settings
   - Initializes models and views
   - Handles UI interactions and navigation

### Models

1. **Template Model (`popup/models/Template.ts`)**
   - Manages template data (system prompts, user prompts)
   - Handles template creation, updating, and deletion
   - Provides domain-specific template filtering
   - Persists templates to storage

2. **Settings Model (`popup/models/Settings.ts`)**
   - Manages user preferences and settings
   - Handles API configuration (key, URL, model)
   - Manages theme settings
   - Persists settings to storage

### Views

1. **Template List View (`popup/views/TemplateList.ts`)**
   - Displays the list of available templates
   - Handles template selection events
   - Manages template deletion UI

2. **Template Editor View (`popup/views/TemplateEditor.ts`)**
   - Provides interface for editing templates
   - Handles saving template changes
   - Manages domain-specific settings

3. **Settings View (`popup/views/Settings.ts`)**
   - Interface for editing extension settings
   - Manages API configuration input
   - Handles theme selection

### Services

1. **API Service (`generate/api-service.ts`)**
   - Handles communication with external LLM APIs
   - Manages API requests and responses
   - Handles error cases and timeouts

2. **Storage Service (`utils/storage-service.ts`)**
   - Provides abstraction over Chrome storage API
   - Handles serialization and deserialization
   - Manages error handling for storage operations

3. **Theme Service (`popup/views/Theme.ts`)**
   - Manages application theming
   - Handles system theme detection
   - Applies theme changes

## Data Flow

### Template Creation and Usage Flow

1. **Template Creation**
   - User opens the extension popup
   - User creates/edits a template in TemplateEditor
   - TemplateModel saves the template to StorageService
   - StorageService persists to Chrome Storage
   - Background script is notified of changes
   - Context menu is updated with the new template

2. **Template Usage**
   - User right-clicks on a text field
   - Context menu is displayed with available templates
   - User selects a template
   - Background script receives the selection
   - Template is sent to the content script
   - Content script fills the text field with the template

### Text Generation Flow

1. **Text Generation Request**
   - User selects a template with API generation enabled
   - Content script sends generation request to background
   - Background script uses APIService to make external request
   - Animation is displayed while waiting for response
   - Response is received and passed back to content script
   - Content script updates the text field with generated content

### Settings and Theme Flow

1. **Settings Management**
   - User updates settings in the Settings view
   - Settings are passed to SettingsModel
   - SettingsModel updates and persists changes
   - Services that depend on settings are notified

2. **Theme Management**
   - User selects a theme or system uses default
   - ThemeService applies the appropriate theme
   - UI components update to reflect the theme

## Error Handling Strategy

1. **API Errors**
   - Network errors are caught and displayed to the user
   - Invalid API keys trigger helpful error messages
   - Timeouts are handled gracefully

2. **Storage Errors**
   - Failed storage operations are logged
   - Default values are used when storage fails
   - Critical errors are reported to the user

3. **Message Passing Errors**
   - Communication errors between components are logged
   - Fallbacks exist for failed communication

## Performance Considerations

1. **Context Menu Updates**
   - Context menu only updates when templates change
   - Domain-specific filtering reduces menu clutter

2. **Storage Usage**
   - Data is stored efficiently
   - Templates are serialized appropriately

3. **Animation**
   - Text generation includes animation for user feedback
   - Animations timeout after a configurable period

## Security Considerations

1. **API Key Storage**
   - API keys are stored in Chrome's secure storage
   - Keys are never exposed in the DOM

2. **Content Security**
   - Content script follows proper isolation practices
   - No arbitrary code execution from templates

3. **Permission Usage**
   - Minimal permissions are requested
   - Each permission has a specific purpose clearly communicated to users