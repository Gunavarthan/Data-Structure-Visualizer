import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { VisualizerComponent } from './pages/visualizer/visualizer';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'visualizer/:dsType', component: VisualizerComponent }
];

