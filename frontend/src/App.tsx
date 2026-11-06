import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { YoloPage } from "./pages/YoloPage";
import { FasterRCNNPage } from "./pages/FasterRCNNPage";
import { MaskRCNNPage } from "./pages/MaskRCNNPage";
import { VGG16Page } from "./pages/VGG16Page";
import { ModelsPage } from "./pages/ModelsPage";
import { ComparePage } from "./pages/ComparePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/yolo" element={<YoloPage />} />
        <Route path="/faster-rcnn" element={<FasterRCNNPage />} />
        <Route path="/mask-rcnn" element={<MaskRCNNPage />} />
        <Route path="/vgg16" element={<VGG16Page />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </Router>
  );
};

export default App;
