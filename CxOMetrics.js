(function () {
  const parseMetadata = metadata => {
    const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata
    const dimensions = []
    for (const key in dimensionsMap) {
      const dimension = dimensionsMap[key]
      dimensions.push({ key, ...dimension })
    }
    const measures = []
    for (const key in measuresMap) {
      const measure = measuresMap[key]
      measures.push({ key, ...measure })
    }
    return { dimensions, measures, dimensionsMap, measuresMap }
  }

  const template = document.createElement('template')
  template.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        font-family: "Segoe UI", Arial, sans-serif;
        overflow-y: auto;
        padding: 10px;
        box-sizing: border-box;
      }
      .card-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .dimension-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
      }
      .dimension-tag {
        background-color: #f1f5f9;
        color: #475569;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .measure-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
      }
      .measure-label {
        font-size: 13px;
        color: #64748b;
      }
      .measure-value {
        font-size: 18px;
        font-weight: bold;
        color: #0f172a;
      }
    </style>
    <div id="root" class="card-container"></div>
  `

  class CxOMetricsWidget extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('root')
    }

    onCustomWidgetResize (width, height) {
      this.render()
    }

    onCustomWidgetAfterUpdate (changedProps) {
      this.render()
    }

    render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') { 
        this._root.innerHTML = `<div style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 20px;">Please assign dimensions and measures.</div>`
        return 
      }

      const { data, metadata } = dataBinding
      const { dimensions, measures } = parseMetadata(metadata)

      if (dimensions.length === 0 || measures.length === 0) {
        return
      }

      this._root.innerHTML = '';

      // Loop through each row of data
      data.forEach(row => {
        const card = document.createElement('div');
        card.className = 'metric-card';

        // 1. Process multiple dimensions dynamically
        let tagsHtml = '';
        dimensions.forEach(dim => {
            const dimLabel = row[dim.key].label;
            tagsHtml += `<span class="dimension-tag">${dimLabel}</span>`;
        });

        const dimensionDiv = document.createElement('div');
        dimensionDiv.className = 'dimension-row';
        dimensionDiv.innerHTML = tagsHtml;
        card.appendChild(dimensionDiv);

        // 2. Process measures
        measures.forEach(measure => {
            const measureData = row[measure.key];
            const displayValue = measureData.formattedValue ? measureData.formattedValue : measureData.raw.toLocaleString();
            
            const measureDiv = document.createElement('div');
            measureDiv.className = 'measure-row';
            measureDiv.innerHTML = `
              <span class="measure-label">${measure.id}</span>
              <span class="measure-value">${displayValue}</span>
            `;
            card.appendChild(measureDiv);
        });

        this._root.appendChild(card);
      });
    }
  }

  customElements.define('com-sap-sample-cxometrics', CxOMetricsWidget)
})()