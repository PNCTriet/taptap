"use client";

import React from "react";
import Link from "next/link";
import type * as LeafletNamespace from "leaflet";
import {
  CheckCircle2,
  Compass,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation as NavigationIcon,
  Radio,
  RotateCcw,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import {
  SAIGON_ZOO_CENTER,
  SAIGON_ZOO_DEMO_TRAIL,
  calculateDistanceMeters,
  formatDistance,
  getWalkingDirectionsUrl,
  type GeoPoint,
} from "@/lib/geo";
import {
  StationIllustration,
  getStationPinHtml,
} from "@/components/station-artwork";
import { AppIcon } from "@/components/ui/app-icon";

export interface ZooGpsMapProps {
  initialStationSlug?: string;
  compact?: boolean;
  onDistancesChange?: (distances: Record<string, number>) => void;
}

interface UserGpsState extends GeoPoint {
  accuracy: number;
  mode: "live" | "demo";
}

export function ZooGpsMap({
  initialStationSlug,
  compact = false,
  onDistancesChange,
}: ZooGpsMapProps) {
  const { locale, t, stations, isStationCollected } = useExplorer();

  const sortedStations = React.useMemo(() => {
    return stations
      .slice()
      .sort((a, b) => a.stamp.sortOrder - b.stamp.sortOrder);
  }, [stations]);

  const [selectedStationId, setSelectedStationId] = React.useState<string>(
    () => {
      if (initialStationSlug) {
        const found = sortedStations.find(
          (s) => s.slug === initialStationSlug
        );
        if (found) return found.id;
      }
      return sortedStations[0]?.id ?? "";
    }
  );

  const [userGps, setUserGps] = React.useState<UserGpsState | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = React.useState<string | null>(
    null
  );
  const [isDemoWalking, setIsDemoWalking] = React.useState(false);

  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const leafletRef = React.useRef<typeof LeafletNamespace | null>(null);
  const mapInstanceRef = React.useRef<LeafletNamespace.Map | null>(null);
  const stationMarkersRef = React.useRef<
    Map<string, LeafletNamespace.Marker>
  >(new Map());
  const userMarkerRef = React.useRef<LeafletNamespace.Marker | null>(null);
  const userAccuracyCircleRef = React.useRef<LeafletNamespace.Circle | null>(
    null
  );
  const walkingLineRef = React.useRef<LeafletNamespace.Polyline | null>(null);
  const watchIdRef = React.useRef<number | null>(null);

  const selectedStation = React.useMemo(() => {
    return (
      sortedStations.find((s) => s.id === selectedStationId) ??
      sortedStations[0] ??
      null
    );
  }, [sortedStations, selectedStationId]);

  const stationDistances = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (!userGps) return map;
    for (const st of sortedStations) {
      map[st.id] = calculateDistanceMeters(
        userGps.lat,
        userGps.lng,
        st.latitude,
        st.longitude
      );
    }
    return map;
  }, [sortedStations, userGps]);

  React.useEffect(() => {
    if (onDistancesChange) {
      onDistancesChange(stationDistances);
    }
  }, [stationDistances, onDistancesChange]);

  const distanceToZooCenter = React.useMemo(() => {
    if (!userGps) return null;
    return calculateDistanceMeters(
      userGps.lat,
      userGps.lng,
      SAIGON_ZOO_CENTER.lat,
      SAIGON_ZOO_CENTER.lng
    );
  }, [userGps]);

  // Initialize Leaflet Map once on client
  React.useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng],
        zoom: compact ? 16 : 17,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 20,
          subdomains: "abcd",
        }
      ).addTo(map);

      if (!compact) {
        L.control.zoom({ position: "bottomright" }).addTo(map);
      }

      const trailCoords: [number, number][] = sortedStations.map((st) => [
        st.latitude,
        st.longitude,
      ]);

      if (trailCoords.length > 1) {
        L.polyline(trailCoords, {
          color: "#176B61",
          weight: 3.5,
          opacity: 0.5,
          dashArray: "8 8",
        }).addTo(map);
      }

      mapInstanceRef.current = map;

      for (const st of sortedStations) {
        const icon = L.divIcon({
          className: "leaflet-div-icon",
          html: getStationPinHtml(st.id, {
            sortOrder: st.stamp.sortOrder,
            collected: isStationCollected(st.id),
            selected: st.id === selectedStationId,
          }),
          iconSize: [48, 54],
          iconAnchor: [24, 52],
        });

        const marker = L.marker([st.latitude, st.longitude], { icon })
          .addTo(map)
          .on("click", () => {
            setSelectedStationId(st.id);
          });

        stationMarkersRef.current.set(st.id, marker);
      }
    }

    const markersMap = stationMarkersRef.current;
    void initMap();

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update station pin icons whenever selectedStationId or collected state changes
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    for (const st of sortedStations) {
      const marker = stationMarkersRef.current.get(st.id);
      if (!marker) continue;

      const icon = L.divIcon({
        className: "leaflet-div-icon",
        html: getStationPinHtml(st.id, {
          sortOrder: st.stamp.sortOrder,
          collected: isStationCollected(st.id),
          selected: st.id === selectedStationId,
        }),
        iconSize: [48, 54],
        iconAnchor: [24, 52],
      });
      marker.setIcon(icon);
    }

    if (selectedStation) {
      map.panTo([selectedStation.latitude, selectedStation.longitude], {
        animate: true,
        duration: 0.45,
      });
    }
  }, [selectedStationId, sortedStations, selectedStation, isStationCollected]);

  // Update user GPS radar marker & walking line on the Leaflet map
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (!userGps) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
      if (walkingLineRef.current) {
        walkingLineRef.current.remove();
        walkingLineRef.current = null;
      }
      return;
    }

    const radarHtml = `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <span class="animate-gps-radar" style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(77,115,207,0.38);"></span>
        <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:#4D73CF;border:3px solid #FFFDF8;box-shadow:0 2px 8px rgba(39,46,43,0.35);"></span>
      </div>
    `;

    const radarIcon = L.divIcon({
      className: "leaflet-div-icon",
      html: radarHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userGps.lat, userGps.lng], {
        icon: radarIcon,
        zIndexOffset: 500,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userGps.lat, userGps.lng]);
      userMarkerRef.current.setIcon(radarIcon);
    }

    if (!userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current = L.circle([userGps.lat, userGps.lng], {
        radius: Math.min(Math.max(userGps.accuracy, 10), 80),
        color: "#4D73CF",
        weight: 1,
        fillColor: "#4D73CF",
        fillOpacity: 0.1,
      }).addTo(map);
    } else {
      userAccuracyCircleRef.current.setLatLng([userGps.lat, userGps.lng]);
      userAccuracyCircleRef.current.setRadius(
        Math.min(Math.max(userGps.accuracy, 10), 80)
      );
    }

    if (selectedStation && (distanceToZooCenter ?? 0) < 3000) {
      const coords: [number, number][] = [
        [userGps.lat, userGps.lng],
        [selectedStation.latitude, selectedStation.longitude],
      ];
      if (!walkingLineRef.current) {
        walkingLineRef.current = L.polyline(coords, {
          color: "#4D73CF",
          weight: 3,
          dashArray: "5 7",
          opacity: 0.85,
        }).addTo(map);
      } else {
        walkingLineRef.current.setLatLngs(coords);
      }
    } else if (walkingLineRef.current) {
      walkingLineRef.current.remove();
      walkingLineRef.current = null;
    }
  }, [userGps, selectedStation, distanceToZooCenter]);

  // Demo Walk simulator (updates user GPS along Saigon Zoo trail every 1000ms)
  React.useEffect(() => {
    if (!isDemoWalking) return;

    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let stepIndex = 0;
    const applyStep = (idx: number) => {
      const pt =
        SAIGON_ZOO_DEMO_TRAIL[idx % SAIGON_ZOO_DEMO_TRAIL.length] ??
        SAIGON_ZOO_CENTER;
      setUserGps({
        lat: pt.lat,
        lng: pt.lng,
        accuracy: 12,
        mode: "demo",
      });

      let nearestId = selectedStationId;
      let minD = Number.POSITIVE_INFINITY;
      for (const st of sortedStations) {
        const d = calculateDistanceMeters(
          pt.lat,
          pt.lng,
          st.latitude,
          st.longitude
        );
        if (d < minD) {
          minD = d;
          nearestId = st.id;
        }
      }
      setSelectedStationId(nearestId);
    };

    applyStep(0);
    const interval = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % SAIGON_ZOO_DEMO_TRAIL.length;
      applyStep(stepIndex);
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoWalking]);

  const handleStartLiveGps = () => {
    setIsDemoWalking(false);
    setGpsStatusMessage(null);

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsStatusMessage(
        locale === "vi"
          ? "Thiết bị không hỗ trợ GPS. Hãy thử Giả lập đi bộ."
          : "GPS unavailable on this device. Try Demo Walk."
      );
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextGps: UserGpsState = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15),
          mode: "live",
        };
        setUserGps(nextGps);

        const distFromZoo = calculateDistanceMeters(
          nextGps.lat,
          nextGps.lng,
          SAIGON_ZOO_CENTER.lat,
          SAIGON_ZOO_CENTER.lng
        );

        if (distFromZoo <= 2000 && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([nextGps.lat, nextGps.lng], 17, {
            duration: 0.6,
          });
        }
      },
      () => {
        setGpsStatusMessage(
          locale === "vi"
            ? "Chưa cấp quyền vị trí. Đang bật Giả lập đi bộ."
            : "Location permission denied. Using Demo Walk instead."
        );
        setIsDemoWalking(true);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  };

  const handleRecenterZoo = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng], 17, {
      duration: 0.6,
    });
  };

  const selectedDistance = selectedStation
    ? stationDistances[selectedStation.id] ?? null
    : null;
  const isSelectedCollected = selectedStation
    ? isStationCollected(selectedStation.id)
    : false;

  return (
    <div
      data-testid="zoo-gps-map"
      className="paper-card overflow-hidden"
    >
      {/* Top Floating GPS Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DECB] bg-[#FFFDF8] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#176B61] animate-pulse" />
          <span className="type-heading text-xs text-[#272E2B]">
            {locale === "vi"
              ? "Bản đồ GPS Thảo Cầm Viên"
              : "Saigon Zoo GPS Trail"}
          </span>
          {userGps && (
            <span className="type-mono rounded-full bg-[#EAF0FB] px-2 py-0.5 text-[10px] font-bold text-[#4D73CF]">
              {userGps.mode === "demo"
                ? locale === "vi"
                  ? "GPS Giả lập"
                  : "Demo GPS"
                : `±${userGps.accuracy}m`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="gps-locate-button"
            onClick={handleStartLiveGps}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              userGps?.mode === "live"
                ? "bg-[#4D73CF] text-white shadow-xs"
                : "border border-[#E6DECB] bg-[#FFF8EB] text-[#272E2B] hover:bg-[#F5EFE2]"
            }`}
          >
            <AppIcon icon={LocateFixed} size="xs" />
            <span>{locale === "vi" ? "Vị trí của tôi" : "Locate me"}</span>
          </button>

          <button
            type="button"
            data-testid="gps-demo-walk-button"
            onClick={() => setIsDemoWalking((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              isDemoWalking
                ? "bg-[#F07861] text-white shadow-xs"
                : "border border-[#E6DECB] bg-[#FFF8EB] text-[#272E2B] hover:bg-[#F5EFE2]"
            }`}
          >
            <AppIcon icon={Footprints} size="xs" />
            <span>
              {isDemoWalking
                ? locale === "vi"
                  ? "Đang đi…"
                  : "Walking…"
                : locale === "vi"
                  ? "Giả lập đi bộ"
                  : "Demo Walk"}
            </span>
          </button>

          <button
            type="button"
            data-testid="gps-recenter-button"
            onClick={handleRecenterZoo}
            aria-label={locale === "vi" ? "Về Thảo Cầm Viên" : "Recenter Zoo"}
            className="inline-flex items-center gap-1 rounded-full border border-[#E6DECB] bg-[#FFF8EB] px-2.5 py-1.5 text-xs font-extrabold text-[#525D58] hover:text-[#272E2B] transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            <AppIcon icon={RotateCcw} size="xs" />
            <span className="hidden sm:inline">
              {locale === "vi" ? "Về Thảo Cầm Viên" : "Recenter Zoo"}
            </span>
          </button>
        </div>
      </div>

      {/* Notice Banner if User is > 2km from Saigon Zoo or GPS message */}
      {(gpsStatusMessage ||
        (userGps?.mode === "live" &&
          distanceToZooCenter !== null &&
          distanceToZooCenter > 2000)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2C653] bg-[#FDF6DF] px-4 py-2 text-xs font-bold text-[#272E2B]">
          <span>
            {gpsStatusMessage ??
              (locale === "vi"
                ? `Bạn cách Thảo Cầm Viên ${formatDistance(
                    distanceToZooCenter ?? 0,
                    locale
                  )}.`
                : `You are ${formatDistance(
                    distanceToZooCenter ?? 0,
                    locale
                  )} from Saigon Zoo.`)}
          </span>
          <button
            type="button"
            onClick={() => setIsDemoWalking(true)}
            className="rounded-full bg-[#272E2B] px-2.5 py-0.5 text-[11px] font-extrabold text-white active:scale-[0.97] cursor-pointer"
          >
            {locale === "vi" ? "Bật Giả lập đi bộ" : "Start Demo Walk"}
          </button>
        </div>
      )}

      {/* Interactive Leaflet Map Canvas */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          data-testid="leaflet-map-canvas"
          className={`w-full ${compact ? "h-64 sm:h-72" : "h-[360px] sm:h-[440px]"}`}
        />

        {/* Quick Station Selector Chips Floating at Top of Map */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex gap-1.5 overflow-x-auto pb-1">
          {sortedStations.map((st) => {
            const active = st.id === selectedStationId;
            const collected = isStationCollected(st.id);
            const dist = stationDistances[st.id];

            return (
              <button
                key={st.id}
                type="button"
                data-testid={`map-station-chip-${st.stamp.sortOrder}`}
                onClick={() => setSelectedStationId(st.id)}
                className={`pointer-events-auto shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-sm backdrop-blur-md transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  active
                    ? "border-[#176B61] bg-[#176B61] text-white"
                    : "border-[#E6DECB] bg-white/95 text-[#272E2B] hover:bg-[#FFF8EB]"
                }`}
              >
                <span className="type-mono text-[11px]">
                  {collected ? "✓" : `#${st.stamp.sortOrder}`}
                </span>
                <span>{t(st.name)}</span>
                {typeof dist === "number" && (
                  <span
                    className={`type-mono rounded-full px-1.5 py-0.2 text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#F5EFE2] text-[#525D58]"
                    }`}
                  >
                    {formatDistance(dist, locale)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Bottom Sheet for Selected Station */}
      {selectedStation && (
        <div
          key={selectedStation.id}
          data-testid="map-station-sheet"
          className="animate-sheet-up border-t border-[#E6DECB] bg-[#FFFDF8] p-4"
        >
          <div className="flex items-center gap-3.5">
            <StationIllustration
              stationIdOrSlug={selectedStation.id}
              variant="avatar"
              className="h-16 w-16 shrink-0 border border-[#E6DECB] shadow-xs"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="type-mono rounded-full bg-[#F5EFE2] px-2 py-0.5 text-[10px] font-extrabold text-[#272E2B]">
                  #{selectedStation.stamp.sortOrder}
                </span>
                {isSelectedCollected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] px-2 py-0.5 text-[10px] font-extrabold text-[#176B61]">
                    <AppIcon icon={CheckCircle2} size="xs" />
                    {locale === "vi" ? "Đã đóng dấu" : "Stamped"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECE8] px-2 py-0.5 text-[10px] font-extrabold text-[#DE634C]">
                    <AppIcon icon={Radio} size="xs" />
                    {locale === "vi" ? "Chạm NFC tại trạm" : "Tap NFC at station"}
                  </span>
                )}
                {selectedDistance !== null && (
                  <span
                    data-testid="selected-station-distance"
                    className="type-mono inline-flex items-center gap-1 rounded-full bg-[#EAF0FB] px-2 py-0.5 text-[10px] font-extrabold text-[#4D73CF]"
                  >
                    <AppIcon icon={MapPin} size="xs" />
                    {formatDistance(selectedDistance, locale)}
                  </span>
                )}
              </div>

              <h3 className="font-display-serif mt-1 text-base font-extrabold text-[#272E2B] truncate">
                {t(selectedStation.name)}
              </h3>
              <p className="text-xs font-medium text-[#525D58] line-clamp-1">
                {t(selectedStation.locationHint)} —{" "}
                {t(selectedStation.description)}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6DECB]/70 pt-3">
            <div className="flex items-center gap-2">
              <a
                href={getWalkingDirectionsUrl(
                  selectedStation.latitude,
                  selectedStation.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white px-3.5 py-2 text-xs font-extrabold text-[#272E2B] hover:bg-[#F5EFE2] transition-all active:scale-[0.97]"
              >
                <AppIcon icon={NavigationIcon} size="xs" className="text-[#4D73CF]" />
                <span>{locale === "vi" ? "Chỉ đường" : "Directions"}</span>
              </a>

              {compact && (
                <Link
                  href={`/map?station=${selectedStation.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white px-3.5 py-2 text-xs font-extrabold text-[#272E2B] hover:bg-[#F5EFE2] transition-all active:scale-[0.97]"
                >
                  <AppIcon icon={Compass} size="xs" className="text-[#176B61]" />
                  <span>{locale === "vi" ? "Mở bản đồ" : "Full Map"}</span>
                </Link>
              )}
            </div>

            <Link
              href={`/s/${selectedStation.tag.publicCode}`}
              data-testid="map-sheet-tap-link"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#176B61] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#12564E] transition-all active:scale-[0.97]"
            >
              <AppIcon icon={Radio} size="xs" className="text-[#F2C653]" />
              <span>
                {isSelectedCollected
                  ? locale === "vi"
                    ? "Mở trạm"
                    : "Open Station"
                  : locale === "vi"
                    ? "Chạm trạm NFC"
                    : "Tap NFC Station"}
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
