# Implementation Plan - Full UI Migration to React Native

This plan details the step-by-step conversion of all existing web pages and components to high-quality React Native (Expo) components using **NativeWind** for styling and **Lucide-React-Native** for icons.

## Proposed Changes

### [Phase 1: Shared Native Components]
Create a set of reusable native components to ensure UI consistency across the app.
- **`NativeCard.tsx`**: A styled `View` for consistent grouping.
- **`NativeButton.tsx`**: A `TouchableOpacity` with variants (Primary, Secondary, Danger).
- **`NativeInput.tsx`**: A `TextInput` with integrated labels and styling.

### [Phase 2: Feature Pages Migration]
Rewrite each web page using React Native components and hooks.

#### 1. Dashboard Migration
- **Target**: `src/pages/Dashboard.native.tsx` (to be used in `App.tsx`).
- **Components**: Use `View` for stat grids, `ScrollView` for the main layout, and `FlatList` for the "Recent Activity" section.

#### 2. Products List Migration
- **Target**: `src/pages/Products.native.tsx`.
- **Features**: Implement a sticky search header, a horizontal `ScrollView` for category pills, and a performant `FlatList` for product cards.
- **Modals**: Convert `StockModal` and `DeleteConfirmation` to native `Modal` or bottom sheets.

#### 3. Product Form Migration
- **Target**: `src/components/ProductForm.native.tsx`.
- **Integration**: Incorporate the newly created `AppImagePicker` for photos/gallery. Use native pickers for categories.

#### 4. History Migration
- **Target**: `src/pages/History.native.tsx`.
- **Layout**: Simple `FlatList` showing transaction logs with color-coded indicators.

### [Phase 3: Navigation Integration]
- Update `App.tsx` to link the real native pages to the Bottom Tab and Stack navigators.

## Verification Plan

### Automated Verification
- Verify that no HTML tags (`div`, `span`, `img`, `button`) remain in the `.native.tsx` files.
- Ensure all styles are applied via `className` (NativeWind).

### Manual Verification (on device/emulator)
- **Navigation**: Verify smooth transitions between Dashboard, Products, and History tabs.
- **Scrolling**: Test the scrolling performance of the Products list with many items.
- **Form Submission**: Add a product with an image and verify it appears in the list.
