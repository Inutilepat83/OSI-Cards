import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NgDocPageComponent as NgDocPageComponentBase } from '@ng-doc/app';

/**
 * Component that wraps ng-doc page rendering
 * Uses ng-doc's built-in page component to render documentation pages
 */
@Component({
  selector: 'app-ng-doc-page',
  standalone: true,
  imports: [CommonModule, NgDocPageComponentBase],
  template: `<ng-doc-page></ng-doc-page>`
})
export class NgDocPageComponent implements OnInit {
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Ng-doc page component handles page rendering automatically
    // based on the current route
  }
}

