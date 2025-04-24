# Foundation Fill Architecture

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
    User -->|Right-clicks on text field| Browser
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
    classDef component fill:#f9f,stroke:#333,stroke-width:2px;
    classDef service fill:#bbf,stroke:#333,stroke-width:1px;
    classDef model fill:#bfb,stroke:#333,stroke-width:1px;
    classDef view fill:#ffb,stroke:#333,stroke-width:1px;
    classDef external fill:#ddd,stroke:#333,stroke-width:1px;
    classDef user fill:#fbb,stroke:#333,stroke-width:2px;
    
    class User user;
    class Popup,Background,ContentScript,Browser component;
    class ThemeService,APIService,StorageService,MessageService,TemplateService service;
    class TemplateModel,SettingsModel model;
    class TemplateList,TemplateEditor,Settings view;
    class Storage,API external;
```

## Data Flow Description

1. **User Interaction:**
   - User interacts with the extension via the popup interface or context menu
   - Templates are managed through the popup UI
   - Templates are applied through context menu on text fields

2. **Component Communication:**
   - Background script acts as the central coordinator
   - Content script interacts with webpage DOM
   - Popup script manages user interface and settings
   - Chrome storage API stores templates and settings

3. **Template Processing:**
   - Templates are stored with system prompts and user prompts
   - Templates can be domain-specific and filtered accordingly
   - When a template is selected, it can be enhanced with:
     - Page content (optional)
     - API generation (if API key is configured)

4. **External API Integration:**
   - Extension sends template data to configured API
   - Generated text is returned and inserted into the active text field
   - Fallbacks exist for when API is unavailable or errors occur

5. **Event Handling:**
   - Context menu updates when tabs change or templates are updated
   - Settings changes trigger immediate application of preferences
   - Theme changes are applied without page reload

6. **Error Handling:**
   - API errors are displayed to the user
   - Missing configuration shows helpful messages
   - Network issues are gracefully handled with fallbacks