' Script name: AudioFade
'
' Smoothly fades audio in and out during transitions instead of cutting abruptly.
' Only applies to inputs that have "AudioFade" in their title.
'
' On startup the script configures each matching input:
'   - AudioAutoOff: prevents vMix from auto-muting on transition
'   - AutoPlayOn:   resumes playback when the input goes live
'   - AutoRestartOff/AutoPauseOff: keeps the video running continuously
'
' When a matching input goes off-air it fades to 0 over FADE_DOWN_TIME, then pauses
' and rewinds. When it comes back on-air it unmutes and fades up to MAX_VOLUME.

Dim SCRIPT_NAME As String = "audio-fade"
Dim SCRIPT_VERSION As String = "1.0.6"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AudioFade " & SCRIPT_VERSION)

' --- VERSION CHECK ---
Try
    Dim verRequest As System.Net.HttpWebRequest = System.Net.HttpWebRequest.Create(VERSIONS_URL)
    verRequest.Timeout = 5000
    Dim verResponse As System.Net.HttpWebResponse = verRequest.GetResponse()
    Dim verReader As New System.IO.StreamReader(verResponse.GetResponseStream())
    Dim verJson As String = verReader.ReadToEnd()
    verReader.Close()
    verResponse.Close()

    Dim key As String = """" & SCRIPT_NAME & """:"
    Dim keyIndex As Integer = verJson.IndexOf(key)
    If keyIndex >= 0 Then
        Dim valueStart As Integer = verJson.IndexOf("""", keyIndex + key.Length) + 1
        Dim valueEnd As Integer = verJson.IndexOf("""", valueStart)
        If valueStart > 0 And valueEnd > valueStart Then
            Dim latestVersion As String = verJson.Substring(valueStart, valueEnd - valueStart)
            If latestVersion <> SCRIPT_VERSION Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AudioFade | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " AudioFade | Could not check for updates: " & ex.Message)
End Try

' ===== Configurations =====
Dim MAX_VOLUME As Integer = 91       ' Target volume (0-100) when input is live
Dim FADE_DOWN_TIME As Integer = 3000 ' Fade-out duration in ms when going off-air
Dim FADE_UP_TIME As Integer = 1000   ' Fade-in duration in ms when coming on-air

Dim xml As New System.Xml.XmlDocument()
xml.LoadXml(API.XML())
Dim nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")
Dim inputNode As XmlNode

' Initial setup for all AudioFade inputs
For Each inputNode In nodeList
    Dim inputNumber = inputNode.Attributes("number").Value
    API.Function("AudioAutoOff", inputNumber)
    API.Function("AutoPlayOn", inputNumber)
    API.Function("AutoRestartOff", inputNumber)
    API.Function("AutoPauseOff", inputNumber)
Next

Do While True
    Sleep(500)

    Try
        xml.LoadXml(API.XML())

        Dim activeNumber = xml.SelectSingleNode("//active").InnerText

        nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")

        For Each inputNode In nodeList
            Dim isMuted As String = inputNode.Attributes("muted").Value
            Dim inputNumber As String = inputNode.Attributes("number").Value
            Dim isActive As Boolean = (inputNumber = activeNumber)

            If isMuted = "False" And Not isActive Then
                ' Input went off-air — fade out, pause and rewind
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AudioFade | Fading out input " & inputNumber)
                API.Function("SetVolumeFade", inputNumber, "0," & FADE_DOWN_TIME)
                Sleep(FADE_DOWN_TIME)
                API.Function("AudioOff", inputNumber)
                API.Function("Pause", inputNumber)
                API.Function("SetPosition", inputNumber, "0")
            ElseIf isMuted = "True" And isActive Then
                ' Input came on-air — unmute and fade in
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                Console.WriteLine(timestamp & " AudioFade | Fading in input " & inputNumber)
                API.Function("AudioOn", inputNumber)
                API.Function("SetVolumeFade", inputNumber, MAX_VOLUME & "," & FADE_UP_TIME)
                Sleep(FADE_UP_TIME)
            End If
        Next

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AudioFade | Unexpected error: " & ex.Message)
    End Try
Loop
