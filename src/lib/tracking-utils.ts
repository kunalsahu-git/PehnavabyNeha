/**
 * Utility to generate tracking URLs for common Indian courier services.
 */
export function getTrackingUrl(courierName: string | undefined, trackingNumber: string | undefined): string {
  if (!trackingNumber) return '#';
  
  const courier = courierName?.toLowerCase() || '';
  const track = trackingNumber.trim();

  // Delhivery
  if (courier.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${track}`;
  }

  // BlueDart
  if (courier.includes('bluedart') || courier.includes('blue dart')) {
    return `https://www.bluedart.com/tracking?trackid=${track}`;
  }

  // Ecom Express
  if (courier.includes('ecom')) {
    return `https://ecomexpress.in/tracking/?awb_field=${track}`;
  }

  // Xpressbees
  if (courier.includes('xpressbees')) {
    return `https://www.xpressbees.com/track?awb=${track}`;
  }

  // Ekart
  if (courier.includes('ekart')) {
    return `https://ekartlogistics.com/track/${track}`;
  }

  // DTDC
  if (courier.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/tracking_results.asp?SearchType=awb&Ttype=awb&TrackId=${track}`;
  }

  // Shadowfax
  if (courier.includes('shadowfax')) {
    return `https://www.shadowfax.in/track?awb=${track}`;
  }

  // Shiprocket (Common aggregator)
  if (courier.includes('shiprocket')) {
    return `https://www.shiprocket.in/shipment-tracking/${track}`;
  }

  // Default to a Google search if courier is unknown
  return `https://www.google.com/search?q=track+${encodeURIComponent(courier)}+${encodeURIComponent(track)}`;
}
