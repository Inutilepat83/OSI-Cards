import { Component } from '@angular/core';
import { AICardRendererComponent, OsiCardsContainerComponent, AICardConfig } from 'osi-cards-lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AICardRendererComponent, OsiCardsContainerComponent],
  template: `
    <!-- 
      Card container with padding for tilt effect.
      The tilt effect can extend outside the card boundaries,
      so we need padding to prevent clipping.
    -->
    <div class="card-showcase">
      <h1>OSI Cards Integration Demo</h1>
      <p class="subtitle">Sales Assistance Frontend Integration</p>
      
      <div class="card-wrapper">
        <osi-cards-container>
          <app-ai-card-renderer 
            [cardConfig]="companyCard"
            [tiltEnabled]="true">
          </app-ai-card-renderer>
        </osi-cards-container>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }

    .card-showcase {
      padding: 40px 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      color: #FF7900;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.1rem;
      text-align: center;
      margin: 0 0 40px 0;
    }

    /* 
     * Card wrapper with generous padding for tilt effect.
     * The magnetic tilt can rotate the card up to 15 degrees,
     * which requires extra space to prevent clipping.
     */
    .card-wrapper {
      /* Padding for tilt effect - prevents card from being clipped */
      padding: 40px;
      
      /* Ensure the card is centered */
      display: flex;
      justify-content: center;
      align-items: flex-start;
      
      /* Allow card to grow but have sensible max width */
      max-width: 1200px;
      margin: 0 auto;
      
      /* Preserve 3D transforms for children */
      perspective: 1000px;
      transform-style: preserve-3d;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .card-wrapper {
        padding: 24px 16px;
      }
      
      h1 {
        font-size: 1.8rem;
      }
      
      .card-showcase {
        padding: 24px 12px;
      }
    }
  `]
})
export class AppComponent {
  companyCard: AICardConfig = {
    cardTitle: 'DSM',
    sections: [
      {
        title: 'Company Overview',
        type: 'info',
        fields: [
          { label: 'Industry', value: 'Nutrition & Health' },
          { label: 'Founded', value: '1902' },
          { label: 'Employees', value: '23,000+' },
          { label: 'Headquarters', value: 'Heerlen, Netherlands' },
          { label: 'Annual Revenue', value: '€12.1B' },
          { label: 'Global Presence', value: '50+ Countries' },
          { label: 'CEO', value: 'Dimitri de Vreeze' },
          { label: 'Stock Exchange', value: 'Euronext Amsterdam' }
        ]
      },
      {
        title: 'ICT Investment Profile',
        type: 'analytics',
        fields: [
          { label: 'Annual ICT Budget', value: '€200M', change: 8, trend: 'up' },
          { label: 'Cloud Investment', value: '€50M', change: 15, trend: 'up' },
          { label: 'Digital Transformation', value: '€75M', change: 22, trend: 'up' },
          { label: 'Cybersecurity Budget', value: '€25M', change: 5, trend: 'stable' }
        ]
      },
      {
        title: 'Cloud Adoption',
        type: 'info',
        fields: [
          { label: 'IaaS Usage', value: '75%' },
          { label: 'PaaS Usage', value: '60%' },
          { label: 'SaaS Usage', value: '85%' },
          { label: 'Hybrid Cloud', value: 'Active' },
          { label: 'Multi-Cloud Strategy', value: 'AWS + Azure' }
        ]
      },
      {
        title: 'Network Infrastructure',
        type: 'chart',
        fields: [
          { label: 'Connected Sites', value: 120 },
          { label: 'Total Bandwidth (Gbps)', value: 45 },
          { label: 'SD-WAN Sites', value: 85 },
          { label: 'Cloud Connections', value: 28 }
        ]
      },
      {
        title: 'Innovation & EIC Projects',
        type: 'info',
        fields: [
          { label: 'EIC Grants Awarded', value: '€15M' },
          { label: 'OB Pilot Projects', value: '5 Active' },
          { label: 'Innovation Budget', value: '€3.2M' },
          { label: 'Sustainability Projects', value: '8 Initiatives' }
        ]
      }
    ],
    actions: [
      { type: 'website', label: 'Visit DSM', variant: 'primary', url: 'https://www.dsm.com' },
      { 
        type: 'mail', 
        label: 'Contact Sales', 
        variant: 'outline', 
        email: { 
          contact: { name: 'Orange Business', email: 'sales@orange.com', role: 'Sales' }, 
          subject: 'DSM Inquiry', 
          body: 'Hello,' 
        } 
      }
    ]
  };
}




