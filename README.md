# DSA-VIZ 🎯
**Interactive Data Structures and Algorithms Visualizer**

An interactive web application built with Angular 20 and Matter.js physics engine for visualizing data structures and algorithms with real-time animations, drag-and-drop functionality, and resizable canvases.


<img width="1887" height="970" alt="Image" src="https://github.com/user-attachments/assets/797f612e-6e59-4a80-8257-259aee53085c" />

## 🚀 Features

### Interactive Visualizations
- **Drag & Drop Nodes**: Click and drag any node to reposition it dynamically
- **Resizable Canvas**: Drag the resize handle to adjust visualization area
- **Zoom & Pan**: Mouse wheel zoom and click-drag panning for better view control
- **Real-time Updates**: Instant visual feedback for all operations
- **Physics-based Animation**: Smooth, natural movement using Matter.js

### Advanced UI Components
- **Collapsible Sidebar**: Clean control panel with operation buttons and statistics
- **Live Statistics Display**: Real-time size, height, and traversal information
- **Search Highlighting**: Visual feedback during search operations
- **Operation Feedback**: Clear status messages for all operations

## 📊 Available Data Structures

### Linear Data Structures
- **Stack** - LIFO (Last In, First Out) structure
  - Push, Pop, Peek operations
  - Visual top pointer indication
  
- **Queue** - FIFO (First In, First Out) structure
  - Enqueue, Dequeue, Front operations
  - Front and rear pointer visualization

- **Linked List** - Sequential node-based structure
  - Insert, Delete, Search operations
  - Visual pointer connections between nodes

### Tree Data Structures
- **Binary Tree** - Hierarchical structure with max 2 children per node
  - Insert, Delete operations with automatic balancing visualization
  - Tree traversals: Preorder, Inorder, Postorder, Level-order

- **Binary Search Tree (BST)** - Ordered binary tree
  - Maintains BST property during insertions
  - Search operations with path highlighting
  - Complete traversal methods display

- **Max Heap** - Complete binary tree with heap property
  - Insert with bubble-up animation
  - Extract-max with bubble-down visualization
  - Heap property maintenance

### Algorithms
- **Bubble Sort** - Simple comparison-based sorting
  - Step-by-step visualization of swaps
  - Comparison highlighting during execution

## 🎮 Interactive Controls

### Node Manipulation
- **Drag Nodes**: Click and hold any node to move it around
- **Canvas Resize**: Use the resize handle in bottom-right corner
- **Zoom Control**: Mouse wheel to zoom in/out
- **Pan View**: Click and drag empty canvas area to pan

### Operations Panel
Each data structure provides:
- **Input Field**: Enter values for operations
- **Action Buttons**: Insert, Delete, Search, Clear
- **Statistics Display**: Live updates of structure properties
- **Traversal Results**: Real-time traversal sequences

## 💻 Quick Commands

```bash
ng serve                    # Start local development server
ng build                    # Build for production
ng test                     # Run unit tests
npm start                   # Alternative to ng serve
```

## 🛠 Technical Stack

- **Frontend**: Angular 20 with Standalone Components
- **Physics Engine**: Matter.js for realistic node interactions
- **Styling**: Modern CSS with responsive design
- **Type Safety**: TypeScript with strict mode
- **Testing**: Jasmine + Karma

## 🎯 Key Implementation Features

### Matter.js Integration
- Physics-based node movement and collision detection
- Smooth animations for all operations
- Realistic drag and drop interactions

### Component Architecture
- Standalone Angular components for each data structure
- Shared routing and navigation system
- Modular design for easy extension

### Responsive Design
- Resizable visualization canvas
- Adaptive sidebar layout
- Mobile-friendly touch controls

### Performance Optimizations
- Efficient rendering with requestAnimationFrame
- Optimized collision detection
- Memory management for large datasets

## 📱 Usage

1. **Start Server**: `ng serve` - Navigate to `http://localhost:4200/`
2. **Select Structure**: Choose from the home page grid
3. **Interact**: Use the sidebar controls to perform operations
4. **Visualize**: Watch real-time animations of your operations
5. **Customize**: Resize canvas and drag nodes for optimal viewing

## 🔧 Development

Built with Angular CLI 20.0.3 featuring:
- Modern Angular standalone components
- TypeScript 5.8+ with strict typing
- Matter.js physics engine integration
- Responsive CSS Grid layouts
- Component-based architecture

---

*Explore, Learn, and Visualize Data Structures like never before! 🌟*
