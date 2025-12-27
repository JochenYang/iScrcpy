' Create desktop shortcut using VBScript
option explicit

dim strOutputPath, strFilePath, strArgs, strComment, strCwd, strIcon, strWindowMode, strHotkey
strOutputPath = Wscript.Arguments(0)
strFilePath = Wscript.Arguments(1)
strArgs = Wscript.Arguments(2)
strComment = Wscript.Arguments(3)
strCwd = Wscript.Arguments(4)
strIcon = Wscript.Arguments(5)
strWindowMode = Wscript.Arguments(6)
strHotkey = Wscript.Arguments(7)

sub createFile()
  dim objShell, objLink
  set objShell = CreateObject("WScript.Shell")
  set objLink = objShell.CreateShortcut(strOutputPath)
  objLink.TargetPath = strFilePath
  objLink.Arguments = strArgs
  objLink.Description = strComment
  objLink.WorkingDirectory = strCwd
  objLink.IconLocation = strIcon
  objLink.WindowStyle = strWindowMode
  objLink.Hotkey = strHotkey
  objLink.Save
end sub

call createFile()
