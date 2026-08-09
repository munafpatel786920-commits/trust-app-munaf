import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Get active trust settings logo from localStorage or fallback to public folder
 */
function getLogoUrl(): string {
  try {
    const activeSettings = localStorage.getItem('active_trust_settings');
    if (activeSettings) {
      const parsed = JSON.parse(activeSettings);
      if (parsed && parsed.logoUrl) {
        return parsed.logoUrl;
      }
    }

    // Fallback: search all trust_settings keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trust_settings')) {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && parsed.logoUrl) {
            return parsed.logoUrl;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading trust_settings logo:', e);
  }
  return '/logo.png';
}

/**
 * Capture an HTML container by ID and trigger a direct .pdf file download
 * Maintains exact preview styling (Tailwind layout, borders, tables, margins, colors) 
 * by using html2canvas-pro which natively supports oklch/oklab CSS colors.
 */
export async function downloadContainerAsPDF(containerId: string, fileName: string): Promise<boolean> {
  const origTarget = document.getElementById(containerId);
  if (!origTarget) {
    console.error(`Container with ID ${containerId} not found.`);
    alert('PDF જનરેટ કરવા માટે કન્ટેન્ટ મળી શક્યું નથી.');
    return false;
  }

  // Create isolated offscreen wrapper for clean cloning
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = `${origTarget.offsetWidth || 900}px`;
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '-9999';
  document.body.appendChild(wrapper);

  try {
    // Clone the original target
    const clonedTarget = origTarget.cloneNode(true) as HTMLElement;

    // Ensure all images in the cloned document with alt containing "Logo" or src matching default logo are updated to use the custom logo if available
    const customLogo = getLogoUrl();
    if (customLogo && customLogo !== '/logo.png') {
      const images = clonedTarget.querySelectorAll('img');
      images.forEach(img => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src.includes('logo.png') || alt.toLowerCase().includes('logo')) {
          img.src = customLogo;
        }
      });
    }

    // Check if cloned target already has an image/logo to avoid duplication
    const hasLogo = clonedTarget.querySelector('img[alt*="Logo"], img[alt*="logo"], [class*="trust-logo"], img[src*="logo"]') !== null;
    if (!hasLogo) {
      const logoUrl = getLogoUrl();
      const logoWrapper = document.createElement('div');
      logoWrapper.style.display = 'flex';
      logoWrapper.style.justifyContent = 'flex-start';
      logoWrapper.style.alignItems = 'center';
      logoWrapper.style.width = '100%';
      logoWrapper.style.marginBottom = '16px';
      logoWrapper.style.paddingLeft = '4px';

      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'Trust Logo';
      img.style.height = '50px';
      img.style.maxHeight = '50px';
      img.style.width = 'auto';
      img.style.objectFit = 'contain';
      img.referrerPolicy = 'no-referrer';

      logoWrapper.appendChild(img);
      clonedTarget.insertBefore(logoWrapper, clonedTarget.firstChild);
    }

    // Remove buttons, PDF download triggers, and print action buttons from the PDF capture
    const buttons = clonedTarget.querySelectorAll('button, [title*="PDF"], [title*="પ્રિન્ટ"], [class*="print:hidden"]');
    buttons.forEach(b => b.remove());

    // Clean up elements that are specifically hidden in print/PDF views
    const allEls = clonedTarget.querySelectorAll('*');
    allEls.forEach(el => {
      if (el instanceof HTMLElement) {
        if (el.className && typeof el.className === 'string' && el.className.includes('print:hidden')) {
          el.remove();
        }
      }
    });

    wrapper.appendChild(clonedTarget);

    // Render clone to high-res canvas using html2canvas-pro (native oklch/oklab support)
    const canvas = await html2canvas(clonedTarget, {
      scale: 2.5, // High-definition scaling for crisp text, fine lines, and sharp table borders
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Find the cloned target in the cloned document if needed, but wrapper is enough.
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions with standard margins (10mm on each side)
    const margin = 10;
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = margin;

    // Single page vs Multi-page layout
    if (imgHeight <= pdfHeight - (margin * 2)) {
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let yPos = margin;

      pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        yPos = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(`${fileName}.pdf`);
    return true;

  } catch (error) {
    console.error('PDF Generation Error:', error);
    // Secure fallback to native browser print dialog if anything fails
    printContainer(containerId);
    return false;
  } finally {
    // Clean up offscreen wrapper
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Print a container cleanly in any browser or iframe
 */
export function printContainer(containerId: string) {
  const target = document.getElementById(containerId);
  let logoWrapper: HTMLElement | null = null;
  
  if (target) {
    target.classList.add('is-printing-target');

    // Ensure all images in the document with alt containing "Logo" or src matching default logo are updated to use the custom logo if available
    const customLogo = getLogoUrl();
    if (customLogo && customLogo !== '/logo.png') {
      const images = target.querySelectorAll('img');
      images.forEach(img => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src.includes('logo.png') || alt.toLowerCase().includes('logo')) {
          img.src = customLogo;
        }
      });
    }

    // Check if target already has an image/logo to avoid duplication
    const hasLogo = target.querySelector('img[alt*="Logo"], img[alt*="logo"], [class*="trust-logo"], img[src*="logo"]') !== null;
    if (!hasLogo) {
      const logoUrl = getLogoUrl();
      logoWrapper = document.createElement('div');
      logoWrapper.id = 'dynamic-print-logo-temp';
      logoWrapper.style.display = 'flex';
      logoWrapper.style.justifyContent = 'flex-start';
      logoWrapper.style.alignItems = 'center';
      logoWrapper.style.width = '100%';
      logoWrapper.style.marginBottom = '16px';
      logoWrapper.style.paddingLeft = '4px';

      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'Trust Logo';
      img.style.height = '50px';
      img.style.maxHeight = '50px';
      img.style.width = 'auto';
      img.style.objectFit = 'contain';
      img.referrerPolicy = 'no-referrer';

      logoWrapper.appendChild(img);
      target.insertBefore(logoWrapper, target.firstChild);
    }
  }

  // Trigger browser native print dialog
  window.print();

  if (target) {
    setTimeout(() => {
      target.classList.remove('is-printing-target');
      // Clean up the dynamically added logo so it doesn't stay on the screen
      if (logoWrapper && target.contains(logoWrapper)) {
        target.removeChild(logoWrapper);
      }
    }, 1000);
  }
}
