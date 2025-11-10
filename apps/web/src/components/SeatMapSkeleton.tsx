/**
 * Skeleton loading component for seat map
 * Provides visual feedback while seats are loading
 */
export default function SeatMapSkeleton({ locale }: { locale: string }) {
  const isHebrew = locale === 'he';

  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 bg-blue-700 rounded w-2/3 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-6 bg-blue-700 rounded w-48"></div>
            <div className="h-6 bg-blue-700 rounded w-64"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>

              {/* Legend Skeleton */}
              <div className="flex gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>

              {/* Sections Skeleton */}
              <div className="space-y-8">
                {[1, 2, 3].map((section) => (
                  <div key={section}>
                    <div className="h-6 bg-gray-200 rounded w-24 mb-3"></div>
                    {[1, 2, 3, 4].map((row) => (
                      <div key={row} className="mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="flex flex-wrap gap-1">
                            {[...Array(15)].map((_, i) => (
                              <div
                                key={i}
                                className="w-10 h-10 bg-gray-200 rounded"
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
