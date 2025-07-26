/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'ArtworkManagementSystemWebPartStrings';
import ArtworkManagementSystem from './components/ArtworkManagementSystem';
import VendorDashboard from './components/VendorUI/VendorDashboard';
// import { IArtworkManagementSystemProps } from './components/IArtworkManagementSystemProps';

export interface IArtworkManagementSystemWebPartProps {
  description: string;
}

export default class ArtworkManagementSystemWebPart extends BaseClientSideWebPart<IArtworkManagementSystemWebPartProps> {

  public render(): void {
    const isVendorUI = this.context.pageContext.web.absoluteUrl.includes("piindext.sharepoint.com");
    const element: React.ReactElement<any> = isVendorUI
      ? React.createElement(VendorDashboard, { userEmail: this.context.pageContext.user.email })
      : React.createElement(ArtworkManagementSystem, { description: this.properties.description, userDisplayName: this.context.pageContext.user.displayName });

    ReactDom.render(element, this.domElement);
  }



  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}

