' Script name: Translator
'
' This is a sidechain translator script, which monitors the mic/call input level
' and reduces the volume of the chain Bus when the translator is speaking.
' You can configure the fade times and threshold values below.
'
' The script will automatically detect a mic or vMix Call, and you can also specify
' it manually by adding "Translator" keyword in the input title.
'
' The below configurations are good for a translation scenario when the translator is always speaking.
' If there is music or other parts which should be in full volume you can adjust the settings accordingly:
' VOLUME_FULL2 = 100 (go to 100% volume if no translation for a while)
' Decibels = 20 * Math.Log10(Amplitude)
'
' Script will raise the volume in two stages to make it more smooth. All config time values are in ms.
'
' Source Volume (chain bus)
' |                         ●─────
' |                        /
' |                       /
' |                      /
' |                     /
' |                    /
' |                   /
' |           ●──────●
' |          /
' |●────────●
' +----+----+----+----+----+----+----→ Silence Time (no translation)

Dim SCRIPT_NAME As String = "translator"
Dim SCRIPT_VERSION As String = "1.2.0"
Dim VERSIONS_URL As String = "https://live-miracles.github.io/vmix-master/versions.json"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Translator " & SCRIPT_VERSION)

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
                Console.WriteLine(timestamp & " Translator | Update available: v" & latestVersion & " (running v" & SCRIPT_VERSION & ") - https://github.com/live-miracles/vmix-master")
            End If
        End If
    End If
Catch ex As Exception
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " Translator | Could not check for updates: " & ex.Message)
End Try

' ===== Configurations =====
Dim LOOP_TIME As Integer = 50           ' Wait time between each loop iteration in ms
Dim VOICE_THRESHOLD As Double = 0.1     ' 0.1 ~ -20dB; meterF1 value to consider as voice present
Dim CHAIN_BUS As String = "B"           ' Script will be adjusting volume for this bus

Dim VOLUME_DOWN_TIME As Integer = 350   ' How fast to fade volume down when translator starts speaking
Dim VOLUME_REDUCED As Integer = 50      ' Volume when translator is speaking

Dim SILENCE_LIMIT As Integer = 2000     ' If translator doesn't speak for this duration we will start raising volume
Dim VOLUME_UP_TIME As Integer = 1000    ' How fast to raise volume first time
Dim VOLUME_FULL As Integer = 75         ' How much to raise volume first time

Dim SILENCE_LIMIT2 As Integer = 4000   ' If translator still not speaking it will raise the volume even more
Dim VOLUME_UP_TIME2 As Integer = 2000   ' How fast to raise volume second time
Dim VOLUME_FULL2 As Integer = 85        ' How much to raise volume second time

' ====== State ======
Dim now As Double = 0
Dim lastActiveTimestamp As Double = 0   ' When translator last reached VOICE_THRESHOLD
Dim fadeUpTimestamp As Double = 0       ' When we started fading up volume
Dim fadeDownTimestamp As Double = 0     ' When we started fading down volume
Dim hasDetectedVoice As Boolean = False ' Guard against raising volume before translator has ever spoken

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000, 1, 1)).TotalMilliseconds

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'Translator')]")

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='Audio']")
        End If

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='VideoCall']")
        End If

        If micNode Is Nothing Then
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Translator | No mic / vMix Call input detected.")
            Sleep(5000)
            Continue Do
        End If

        Dim micLevel As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim micMuted As String = micNode.Attributes("muted").Value

        If micLevel > VOICE_THRESHOLD And micMuted = "False" Then
            ' --- Translator is speaking, reduce volume ---
            hasDetectedVoice = True
            lastActiveTimestamp = now
            If now - fadeDownTimestamp > VOLUME_DOWN_TIME Then
                API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_REDUCED & "," & VOLUME_DOWN_TIME))
                fadeDownTimestamp = now
            End If

        ElseIf hasDetectedVoice Then
            ' --- Translator is silent, raise volume ---
            ' Guard prevents raising volume before translator has spoken for the first time
            If now - lastActiveTimestamp > SILENCE_LIMIT2 Then
                If now - fadeUpTimestamp > VOLUME_UP_TIME2 Then
                    API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_FULL2 & "," & VOLUME_UP_TIME2))
                    fadeUpTimestamp = now
                End If

            ElseIf now - lastActiveTimestamp > SILENCE_LIMIT Then
                If now - fadeUpTimestamp > VOLUME_UP_TIME Then
                    API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_FULL & "," & VOLUME_UP_TIME))
                    fadeUpTimestamp = now
                End If
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Translator | Unexpected error: " & ex.Message)
    End Try
Loop
