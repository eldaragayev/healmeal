import ExpoModulesCore
import MapKit

public class MapkitSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MapkitSearch")

    // Comprehensive search: 1 POI request + a few text searches, deduplicated
    AsyncFunction("searchNearbyAll") { (latitude: Double, longitude: Double, radiusMiles: Double) -> [[String: Any]] in
      let center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
      let radiusMeters = radiusMiles * 1609.344
      let spanDelta = (radiusMiles * 2.0) / 69.0

      var allItems: [[String: Any]] = []
      var seenKeys = Set<String>()

      let addItems = { (mapItems: [MKMapItem]) in
        for item in mapItems {
          let lat = item.placemark.coordinate.latitude
          let lng = item.placemark.coordinate.longitude
          let key = "\(item.name ?? "")_\(Int(lat * 1000))_\(Int(lng * 1000))"
          guard !seenKeys.contains(key) else { continue }
          seenKeys.insert(key)

          let dist = CLLocation(latitude: lat, longitude: lng)
            .distance(from: CLLocation(latitude: latitude, longitude: longitude)) / 1609.344
          guard dist <= radiusMiles else { continue }

          allItems.append(self.mapItemToDict(item: item, centerLat: latitude, centerLng: longitude))
        }
      }

      // 1. Category-based POI search (no text query)
      let poiRequest = MKLocalPointsOfInterestRequest(center: center, radius: radiusMeters)
      poiRequest.pointOfInterestFilter = MKPointOfInterestFilter(including: [
        .restaurant, .cafe, .bakery, .foodMarket
      ])
      if let response = try? await MKLocalSearch(request: poiRequest).start() {
        addItems(response.mapItems)
      }

      // 2. Supplementary text searches for broader coverage
      let textQueries = ["fast food", "restaurant", "takeaway"]
      for query in textQueries {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        request.resultTypes = .pointOfInterest
        request.region = MKCoordinateRegion(
          center: center,
          span: MKCoordinateSpan(latitudeDelta: spanDelta, longitudeDelta: spanDelta)
        )
        request.pointOfInterestFilter = MKPointOfInterestFilter(including: [
          .restaurant, .cafe, .bakery, .foodMarket
        ])
        if let response = try? await MKLocalSearch(request: request).start() {
          addItems(response.mapItems)
        }
      }

      return allItems.sorted { ($0["distance"] as? Double ?? 999) < ($1["distance"] as? Double ?? 999) }
    }

    // Single text-based search
    AsyncFunction("searchNearby") { (latitude: Double, longitude: Double, radiusMiles: Double, query: String) -> [[String: Any]] in
      let center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
      let spanDelta = (radiusMiles * 2.0) / 69.0

      let request = MKLocalSearch.Request()
      request.naturalLanguageQuery = query
      request.resultTypes = .pointOfInterest
      request.region = MKCoordinateRegion(
        center: center,
        span: MKCoordinateSpan(latitudeDelta: spanDelta, longitudeDelta: spanDelta)
      )
      request.pointOfInterestFilter = MKPointOfInterestFilter(including: [
        .restaurant, .cafe, .bakery, .foodMarket
      ])

      let search = MKLocalSearch(request: request)
      let response = try await search.start()

      return response.mapItems.map { item in
        self.mapItemToDict(item: item, centerLat: latitude, centerLng: longitude)
      }
    }

    // Autocomplete search using MKLocalSearchCompleter — dispatches to main queue for run loop
    AsyncFunction("completeSearch") { (query: String, latitude: Double, longitude: Double, promise: Promise) in
      let region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
        span: MKCoordinateSpan(latitudeDelta: 2.0, longitudeDelta: 2.0)
      )

      DispatchQueue.main.async {
        let delegate = CompleterDelegate { results in
          let suggestions = results.prefix(6).map { result -> [String: Any] in
            [
              "title": result.title,
              "subtitle": result.subtitle,
            ]
          }
          promise.resolve(suggestions)
        }
        delegate.completer.region = region
        delegate.completer.resultTypes = .address
        delegate.completer.queryFragment = query
        objc_setAssociatedObject(delegate.completer, "completerDelegate", delegate, .OBJC_ASSOCIATION_RETAIN)

        // Timeout after 5s to prevent hanging
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak delegate] in
          delegate?.timeout()
        }
      }
    }

    // Geocode a completer result to get coordinates
    AsyncFunction("geocodeCompletion") { (title: String, subtitle: String) -> [String: Any]? in
      let request = MKLocalSearch.Request()
      request.naturalLanguageQuery = "\(title) \(subtitle)"

      let search = MKLocalSearch(request: request)
      guard let response = try? await search.start(),
            let item = response.mapItems.first else {
        return nil
      }

      let placemark = item.placemark
      var result: [String: Any] = [
        "latitude": placemark.coordinate.latitude,
        "longitude": placemark.coordinate.longitude,
        "name": item.name ?? title,
      ]
      if let city = placemark.locality { result["city"] = city }
      if let country = placemark.country { result["country"] = country }
      return result
    }
  }

  private func mapItemToDict(item: MKMapItem, centerLat: Double, centerLng: Double) -> [String: Any] {
    let placemark = item.placemark
    let itemLat = placemark.coordinate.latitude
    let itemLng = placemark.coordinate.longitude

    let itemLocation = CLLocation(latitude: itemLat, longitude: itemLng)
    let centerLocation = CLLocation(latitude: centerLat, longitude: centerLng)
    let distanceMiles = itemLocation.distance(from: centerLocation) / 1609.344

    var result: [String: Any] = [
      "name": item.name ?? "Unknown",
      "latitude": itemLat,
      "longitude": itemLng,
      "distance": round(distanceMiles * 10) / 10,
    ]

    if let thoroughfare = placemark.thoroughfare {
      if let sub = placemark.subThoroughfare {
        result["address"] = "\(sub) \(thoroughfare)"
      } else {
        result["address"] = thoroughfare
      }
    }
    if let locality = placemark.locality { result["city"] = locality }
    if let postalCode = placemark.postalCode { result["postalCode"] = postalCode }
    if let phone = item.phoneNumber { result["phone"] = phone }
    if let url = item.url?.absoluteString { result["url"] = url }

    return result
  }
}

// Delegate for MKLocalSearchCompleter
private class CompleterDelegate: NSObject, MKLocalSearchCompleterDelegate {
  let completer = MKLocalSearchCompleter()
  private let onResults: ([MKLocalSearchCompletion]) -> Void
  private var completed = false

  init(onResults: @escaping ([MKLocalSearchCompletion]) -> Void) {
    self.onResults = onResults
    super.init()
    completer.delegate = self
  }

  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    guard !completed else { return }
    completed = true
    onResults(completer.results)
  }

  func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
    guard !completed else { return }
    completed = true
    onResults([])
  }

  func timeout() {
    guard !completed else { return }
    completed = true
    completer.cancel()
    onResults([])
  }
}
