import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {
  readonly features = [
    'Real-time Stock Visibility',
    'Multi-Warehouse Management',
    'Purchase Order Workflow',
    'Supplier Management',
    'Low Stock & Overstock Alerts',
    'Reports & Analytics',
    'Role-Based Access Control',
    'Complete Audit Trail',
  ];

  readonly capabilityHighlights = [
    'Track stock levels with up-to-date visibility across your catalog.',
    'Manage warehouses, suppliers, and purchase workflows in one system.',
    'Stay ahead with alerts, analytics, and operational reporting.',
  ];
}
