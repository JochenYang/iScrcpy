[Setup]
AppName=iScrcpy
AppVersion=1.0.0
DefaultDirName={autopf}\iScrcpy
DefaultGroupName=iScrcpy
OutputBaseFilename=iScrcpy-Setup
Compression=lzma2
SolidCompression=yes
WindowVisible=no
SetupIconFile=icon.ico

[Files]
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{autodesktop}\iScrcpy"; Filename: "{app}\iScrcpy.exe"; IconFilename: "{app}\iScrcpy.exe"; Tasks: desktopicon
Name: "{group}\iScrcpy"; Filename: "{app}\iScrcpy.exe"; IconFilename: "{app}\iScrcpy.exe"

[Tasks]
Name: desktopicon; Description: "Create desktop shortcut"; GroupDescription: "Additional icons:"
