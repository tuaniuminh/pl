Pod::Spec.new do |s|
  s.name = 'CapacitorLiveActivityPlugin'
  s.version = '1.0.0'
  s.summary = 'Live Activity and In-App IPA Downloader'
  s.license = 'MIT'
  s.homepage = 'https://github.com/tuaniuminh/pl'
  s.author = 'PlankAI'
  s.source = { :git => 'https://github.com/tuaniuminh/pl.git', :tag => s.version.to_s }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target  = '14.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
